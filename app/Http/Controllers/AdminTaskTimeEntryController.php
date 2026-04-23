<?php

namespace App\Http\Controllers;

use App\Http\Requests\BatchUpdateTaskTimeEntriesRequest;
use App\Http\Requests\StoreManualTaskTimeEntryRequest;
use App\Models\Task;
use App\Models\TaskTimeEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminTaskTimeEntryController extends Controller
{
    public function store(StoreManualTaskTimeEntryRequest $request, Task $task): JsonResponse
    {
        $user = Auth::guard('web')->user();

        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $this->canManageTimeEntries($user)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        if (! $this->canAccessTask($user, $task)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $timeEntry = TaskTimeEntry::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => $this->parseClientDateTime($request->string('start_time')->toString()),
            'end_time' => $this->parseClientDateTime($request->string('end_time')->toString()),
            'description' => $request->string('description')->toString() ?: null,
            'is_active' => false,
        ]);

        $timeEntry->load('user:id,name');

        return response()->json([
            'success' => true,
            'time_entry' => $timeEntry,
        ], 201);
    }

    public function batchUpdate(BatchUpdateTaskTimeEntriesRequest $request, Task $task): JsonResponse
    {
        $user = Auth::guard('web')->user();

        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $this->canManageTimeEntries($user)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        if (! $this->canAccessTask($user, $task)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $requestedEntries = collect($request->validated('entries'));
        $ids = $requestedEntries->pluck('id')->unique()->values()->all();

        /** @var Collection<int, TaskTimeEntry> $existingEntries */
        $existingEntries = TaskTimeEntry::query()
            ->where('task_id', $task->id)
            ->whereIn('id', $ids)
            ->get();

        if ($existingEntries->count() !== count($ids)) {
            return response()->json([
                'message' => 'One or more time entries were not found for this task.',
            ], 422);
        }

        $updatesById = $requestedEntries->keyBy('id');

        foreach ($existingEntries as $existingEntry) {
            if ($existingEntry->is_active || ! $existingEntry->end_time) {
                return response()->json([
                    'message' => 'Active time entries cannot be adjusted. End the entry first.',
                ], 422);
            }

            if (
                ! $user->hasRole('super-admin') &&
                ! $user->hasPermission('task_time_entries.update') &&
                $existingEntry->user_id !== $user->id
            ) {
                return response()->json([
                    'message' => 'You do not have permission to adjust one or more time entries.',
                ], 403);
            }

            $payload = $updatesById->get($existingEntry->id);
            $newStart = $this->parseClientDateTime((string) ($payload['start_time'] ?? ''));
            $newEnd = $this->parseClientDateTime((string) ($payload['end_time'] ?? ''));

            if ($newEnd->lessThanOrEqualTo($newStart)) {
                return response()->json([
                    'message' => 'End time must be after start time.',
                ], 422);
            }
        }

        DB::transaction(function () use ($existingEntries, $updatesById): void {
            foreach ($existingEntries as $existingEntry) {
                $payload = $updatesById->get($existingEntry->id);
                $newStart = $this->parseClientDateTime((string) ($payload['start_time'] ?? ''));
                $newEnd = $this->parseClientDateTime((string) ($payload['end_time'] ?? ''));

                $existingEntry->forceFill([
                    'start_time' => $newStart,
                    'end_time' => $newEnd,
                ])->save();
            }
        });

        $timeEntries = TaskTimeEntry::query()
            ->where('task_id', $task->id)
            ->with('user:id,name')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'time_entries' => $timeEntries,
        ]);
    }

    public function destroy(Task $task, TaskTimeEntry $timeEntry): JsonResponse
    {
        $user = Auth::guard('web')->user();

        if (! $user instanceof User) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $this->canManageTimeEntries($user)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        if (! $this->canAccessTask($user, $task)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($timeEntry->task_id !== $task->id) {
            return response()->json([
                'message' => 'Time entry not found for this task.',
            ], 404);
        }

        if ($timeEntry->is_active || ! $timeEntry->end_time) {
            return response()->json([
                'message' => 'Active time entries cannot be deleted. End the entry first.',
            ], 422);
        }

        if (
            ! $user->hasRole('super-admin') &&
            ! $user->hasPermission('task_time_entries.delete') &&
            $timeEntry->user_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You do not have permission to delete this time entry.',
            ], 403);
        }

        $timeEntry->delete();

        $timeEntries = TaskTimeEntry::query()
            ->where('task_id', $task->id)
            ->with('user:id,name')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'time_entries' => $timeEntries,
        ]);
    }

    protected function canManageTimeEntries(User $user): bool
    {
        return $user->hasRole('super-admin')
            || $user->hasPermission('task_time_entries.create')
            || $user->hasPermission('task_time_entries.update')
            || $user->hasPermission('task_time_entries.delete')
            || $user->hasPermission('task.update');
    }

    protected function canAccessTask(User $user, Task $task): bool
    {
        if ($user->hasRole('super-admin') || $user->hasPermission('task_time_entries.view_all')) {
            return true;
        }

        return $task->assignedUsers()->where('user_id', $user->id)->exists();
    }

    protected function parseClientDateTime(string $value): Carbon
    {
        $timezone = (string) config('app.timezone', 'UTC');

        return Carbon::parse($value)->setTimezone($timezone);
    }
}
