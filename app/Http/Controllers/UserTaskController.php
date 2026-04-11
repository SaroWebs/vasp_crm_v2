<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class UserTaskController extends TimeTrackingController
{
    /**
     * Get tasks with time entries for the current user and specific date.
     */
    public function getTasksWithTimeEntries(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        $date = Carbon::parse($request->input('date', now()->toDateString()))->toDateString();
        $startOfDay = Carbon::parse($date)->startOfDay();
        $endOfDay = Carbon::parse($date)->endOfDay();
        $isToday = Carbon::parse($date)->isSameDay(now());
        $now = now();

        $userTasks = $user->assignedTasks()
            ->with(['timeEntries' => function ($query) use ($user, $startOfDay, $endOfDay, $isToday) {
                $query
                    ->where('user_id', $user->id)
                    ->where('start_time', '<=', $endOfDay)
                    ->where(function ($overlapQuery) use ($startOfDay, $isToday) {
                        $overlapQuery->where(function ($completedQuery) use ($startOfDay) {
                            $completedQuery
                                ->where('is_active', false)
                                ->whereNotNull('end_time')
                                ->where('end_time', '>=', $startOfDay);
                        });

                        if ($isToday) {
                            $overlapQuery->orWhere(function ($activeQuery) {
                                $activeQuery
                                    ->where('is_active', true)
                                    ->whereNull('end_time');
                            });
                        }
                    });
            }, 'slaPolicy'])
            ->get();

        // Filter tasks that have time entries for the selected date
        $tasksWithTimeEntries = $userTasks->filter(function ($task) {
            return $task->timeEntries->count() > 0;
        });

        $tasksWithTimeEntries->each(function ($task) use ($date, $isToday, $now) {
            $totalSecondsForDate = 0;

            $task->timeEntries->each(function ($timeEntry) use ($date, $isToday, $now, &$totalSecondsForDate) {
                $durationSecondsForDate = $timeEntry->calculateDurationForDate(
                    $date,
                    $isToday && $timeEntry->is_active ? $now : null
                );

                $timeEntry->duration_seconds_for_date = $durationSecondsForDate;
                $totalSecondsForDate += $durationSecondsForDate;
            });

            $task->total_seconds_for_date = $totalSecondsForDate;
            $task->total_hours_for_date = round($totalSecondsForDate / 3600, 2);
        });

        return response()->json([
            'tasks' => $tasksWithTimeEntries,
            'date' => $date,
        ]);
    }

    /**
     * Get tasks assigned to the current user.
     * Sorted by: overdue tasks first, then by due date ascending.
     */
    public function getMyTasks()
    {
        $user = Auth::user();
        $tasks = Task::whereHas('assignedUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(['taskType', 'slaPolicy', 'project', 'createdBy', 'assignedUsers'])
            ->orderByRaw("CASE 
                WHEN due_at < NOW() AND state != 'Done' THEN 1 
                WHEN due_at >= NOW() OR due_at IS NULL THEN 2 
                ELSE 3 END")
            ->orderBy('due_at', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tasks);
    }

    /**
     * Get recent tasks for the Board component.
     * Returns all non-completed tasks plus completed tasks from the last 2 days.
     *
     * @return JsonResponse
     */
    public function getBoardTasks()
    {
        /** @var User $user */
        $user = Auth::user();

        // Terminal states that indicate task completion
        $terminalStates = ['Done', 'Cancelled', 'Rejected'];

        $tasks = Task::whereHas('assignedUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with([
            'createdBy:id,name',
            'assignedDepartment:id,name',
            'assignedUsers:id,name',
            'ticket:id,ticket_number,title',
            'taskType:id,name,code',
            'slaPolicy:id,name,priority',
            'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
        ])
            ->where(function ($query) use ($terminalStates) {
                $query->whereNotIn('state', $terminalStates)
                    ->orWhere(function ($subQuery) use ($terminalStates) {
                        $subQuery->whereIn('state', $terminalStates)
                            ->whereNotNull('completed_at')
                            ->where('completed_at', '>=', now()->subDays(2));
                    });
            })
            ->orderByRaw("CASE 
                WHEN state = 'InProgress' THEN 1 
                WHEN state = 'Blocked' THEN 2 
                WHEN state = 'InReview' THEN 3 
                WHEN state = 'Assigned' THEN 4 
                WHEN state = 'Draft' THEN 5 
                ELSE 6 END")
            ->orderBy('due_at', 'asc')
            ->get();

        return response()->json([
            'data' => $tasks,
        ]);
    }
}
