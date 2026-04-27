<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskTimeEntry;
use App\Services\WorkingHoursService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TimeTrackingController extends Controller
{
    /**
     * Start a task time entry.
     */
    public function startTask(Request $request, Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if user explicitly wants to skip the overdue warning
        $skipOverdueWarning = $request->input('skip_overdue_warning', false);

        // Check if task is in any non-terminal state and due date is overdue
        // Terminal states: Done, Cancelled, Rejected
        $terminalStates = ['Done', 'Cancelled', 'Rejected'];
        $isActiveTask = ! in_array($task->state, $terminalStates);
        $isOverdue = $task->due_at && $task->due_at->isPast();

        // If task is active and overdue, and user hasn't skipped warning, return warning
        if ($isActiveTask && $isOverdue && ! $skipOverdueWarning) {
            return response()->json([
                'overdue_warning' => true,
                'message' => 'The due date for this task has passed. Do you want to start anyway or extend the due date?',
                'task' => $task,
                'current_due_date' => $task->due_at->format('Y-m-d H:i:s'),
                'overdue_days' => now()->diffInDays($task->due_at),
            ], 422);
        }

        // Check if current time is working time
        $workingHoursService = app(WorkingHoursService::class);
        $now = now();
        if (! $workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        $result = DB::transaction(function () use ($task, $user, $now) {
            $activeEntries = TaskTimeEntry::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get();

            $activeOnCurrentTask = $activeEntries->firstWhere('task_id', $task->id);

            if ($activeOnCurrentTask) {
                $this->markAssignmentInProgress($task, $user->id);
                $this->syncTaskStateFromAssignments($task);

                return [
                    'created' => false,
                ];
            }

            foreach ($activeEntries as $entry) {
                if ((int) $entry->task_id !== (int) $task->id) {
                    $entry->end();
                }
            }

            TaskTimeEntry::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'start_time' => $now,
                'end_time' => null,
                'description' => null,
                'is_active' => true,
            ]);

            $this->markAssignmentInProgress($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return [
                'created' => true,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => $result['created']
                ? 'Task time tracking started successfully'
                : 'Task is already being tracked by this user',
            'data' => $task->load(['timeEntries:id,task_id,user_id,start_time,end_time,is_active']),
        ]);
    }

    /**
     * Pause a task time entry (ends the current time entry but keeps task active).
     */
    public function pauseTask(Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $paused = DB::transaction(function () use ($task, $user) {
            $activeEntry = TaskTimeEntry::query()
                ->where('task_id', $task->id)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $activeEntry) {
                return false;
            }

            $activeEntry->end();
            $this->markAssignmentAccepted($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return true;
        });

        if (! $paused) {
            return response()->json(['message' => 'No active time tracking for this task'], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task time tracking paused successfully',
            'data' => $task->load(['timeEntries:id,task_id,user_id,start_time,end_time,is_active']),
        ]);
    }

    /**
     * Resume a task time entry (same as start for existing tasks).
     */
    public function resumeTask(Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if current time is working time
        $workingHoursService = app(WorkingHoursService::class);
        $now = now();
        if (! $workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        $result = DB::transaction(function () use ($task, $user, $now) {
            $activeEntries = TaskTimeEntry::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get();

            $activeOnCurrentTask = $activeEntries->firstWhere('task_id', $task->id);

            if ($activeOnCurrentTask) {
                $this->markAssignmentInProgress($task, $user->id);
                $this->syncTaskStateFromAssignments($task);

                return [
                    'created' => false,
                ];
            }

            foreach ($activeEntries as $entry) {
                if ((int) $entry->task_id !== (int) $task->id) {
                    $entry->end();
                }
            }

            TaskTimeEntry::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'start_time' => $now,
                'end_time' => null,
                'description' => null,
                'is_active' => true,
            ]);

            $this->markAssignmentInProgress($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return [
                'created' => true,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => $result['created']
                ? 'Task time tracking resumed successfully'
                : 'Task is already being tracked by this user',
            'data' => $task->load(['timeEntries:id,task_id,user_id,start_time,end_time,is_active']),
        ]);
    }

    /**
     * End a task time entry (ends the current time entry and completes the task).
     */
    public function endTask(Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $ended = DB::transaction(function () use ($task, $user) {
            $activeEntry = TaskTimeEntry::query()
                ->where('task_id', $task->id)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $activeEntry) {
                return false;
            }

            $activeEntry->end();
            $this->markAssignmentCompleted($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return true;
        });

        if (! $ended) {
            return response()->json(['message' => 'No active time tracking for this task'], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task time tracking ended successfully',
            'data' => $task->load(['timeEntries:id,task_id,user_id,start_time,end_time,is_active']),
        ]);
    }

    /**
     * Calculate time spent on a task.
     */
    public function calculateTimeSpent(Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get total time from completed entries (working duration)
        $totalTimeSpent = TaskTimeEntry::getTotalTimeForTask($task); // Returns seconds

        // Get current active time entry duration (working duration)
        $activeEntry = TaskTimeEntry::getActiveEntry($task, $user->id);
        $timeSpent = 0;

        if ($activeEntry) {
            $timeSpent = $activeEntry->calculateDuration(); // Returns seconds (working duration)
        }

        $totalTimeSpent += $timeSpent;

        $estimateHours = $task->estimate_hours ?? 0;
        $estimateSeconds = $estimateHours * 3600;
        $remainingTime = $estimateSeconds - $totalTimeSpent;

        return response()->json([
            'success' => true,
            'data' => [
                'time_spent' => $timeSpent, // Seconds (working duration)
                'total_time_spent' => $totalTimeSpent, // Seconds (working duration)
                'remaining_time' => $remainingTime, // Seconds (working duration)
                'remaining_hours' => $remainingTime / 3600, // For backward compatibility
            ],
        ]);
    }

    /**
     * Calculate remaining time for a task.
     */
    public function calculateRemainingTime(Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $remainingTime = $task->getTimeRemaining();
        $daysRequired = $task->calculateDaysRequired();

        // Get working hours configuration for response
        $workingHoursService = app(WorkingHoursService::class);
        $config = $workingHoursService->getWorkingHoursConfig();

        return response()->json([
            'success' => true,
            'data' => [
                'remaining_time' => $remainingTime, // In hours
                'days_required' => $daysRequired,
                'working_hours_config' => $config,
            ],
        ]);
    }

    /**
     * Get working time spent on a task (working duration).
     */
    public function getWorkingTimeSpent(Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $totalWorkingTime = $task->getTimeRemaining();
        $daysRequired = $task->calculateDaysRequired();

        // Get working time spent from time entries
        $totalTimeSpent = TaskTimeEntry::getTotalTimeForTask($task); // Returns seconds (working duration)

        $activeEntries = TaskTimeEntry::query()
            ->where('task_id', $task->id)
            ->where('is_active', true)
            ->get();

        foreach ($activeEntries as $activeEntry) {
            $totalTimeSpent += $activeEntry->calculateDuration();
        }

        $totalTimeSpentHours = $totalTimeSpent / 3600;

        return response()->json([
            'success' => true,
            'data' => [
                'total_working_time_spent' => $totalTimeSpent, // Seconds
                'total_working_time_spent_hours' => $totalTimeSpentHours, // Hours
                'remaining_working_time' => $totalWorkingTime, // Hours
                'days_required' => $daysRequired,
            ],
        ]);
    }

    /**
     * Get time entries for a task on the current date.
     */
    public function getTaskTimeEntriesForDate(Task $task, $date = null)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Use current date if not provided
        $date = $date ?? now()->toDateString();

        // Get time entries for the task on the specified date
        $timeEntries = TaskTimeEntry::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->whereDate('start_time', $date)
            ->where('is_active', false)
            ->get();

        // Calculate total time spent for the date
        $totalTimeSpent = 0;
        foreach ($timeEntries as $entry) {
            $totalTimeSpent += $entry->calculateDuration();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'time_entries' => $timeEntries,
                'total_time_spent' => $totalTimeSpent,
            ],
        ]);
    }

    /**
     * Get working hours configuration.
     */
    public function getWorkingHoursConfig()
    {
        $workingHoursService = app(WorkingHoursService::class);

        return response()->json([
            'success' => true,
            'data' => [
                'working_hours' => $workingHoursService->getWorkingHoursConfig(),
                'holidays' => $workingHoursService->getHolidaysConfig(),
            ],
        ]);
    }

    /**
     * Extend due date and start task.
     */
    public function extendDueDateAndStart(Request $request, Task $task)
    {
        $user = Auth::user();

        // Check if user is assigned to this task via task_assignments
        $isAssigned = $task->assignedUsers()->where('user_id', $user->id)->exists();
        if (! $isAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Validate the new due date
        $validatedData = $request->validate([
            'due_at' => 'required|date|after:now',
        ]);

        // Extend the due date
        $task->update(['due_at' => $validatedData['due_at']]);

        // Now start the task
        $workingHoursService = app(WorkingHoursService::class);
        $now = now();

        if (! $workingHoursService->isWorkingTime($now)) {
            return response()->json([
                'error' => 'Task actions are not available outside working hours',
                'message' => 'Please resume your work during working hours',
            ], 403);
        }

        $result = DB::transaction(function () use ($task, $user, $now) {
            $activeEntries = TaskTimeEntry::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get();

            $activeOnCurrentTask = $activeEntries->firstWhere('task_id', $task->id);

            if ($activeOnCurrentTask) {
                $this->markAssignmentInProgress($task, $user->id);
                $this->syncTaskStateFromAssignments($task);

                return [
                    'created' => false,
                ];
            }

            foreach ($activeEntries as $entry) {
                if ((int) $entry->task_id !== (int) $task->id) {
                    $entry->end();
                }
            }

            TaskTimeEntry::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'start_time' => $now,
                'end_time' => null,
                'description' => null,
                'is_active' => true,
            ]);

            $this->markAssignmentInProgress($task, $user->id);
            $this->syncTaskStateFromAssignments($task);

            return [
                'created' => true,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => $result['created']
                ? 'Due date extended and task started successfully'
                : 'Task is already being tracked by this user',
            'data' => $task->load(['timeEntries:id,task_id,user_id,start_time,end_time,is_active']),
        ]);
    }

    /**
     * Pause all active tasks for a user except the specified task.
     */
    protected function pauseUserActiveTasks(int $userId, int $excludeTaskId): void
    {
        $activeEntries = TaskTimeEntry::where('user_id', $userId)
            ->where('is_active', true)
            ->whereHas('task', function ($query) use ($excludeTaskId) {
                $query->where('id', '!=', $excludeTaskId);
            })
            ->get();

        foreach ($activeEntries as $entry) {
            $entry->end();
        }
    }

    /**
     * Mark the current user's assignment on this task as in progress.
     */
    protected function markAssignmentInProgress(Task $task, int $userId): void
    {
        $assignment = $this->getActiveAssignment($task, $userId);

        if (! $assignment) {
            return;
        }

        $updates = [
            'state' => 'in_progress',
        ];

        if (! $assignment->accepted_at) {
            $updates['accepted_at'] = now();
        }

        $assignment->update($updates);
    }

    /**
     * Mark the current user's assignment on this task as accepted (paused/not actively tracking).
     */
    protected function markAssignmentAccepted(Task $task, int $userId): void
    {
        $assignment = $this->getActiveAssignment($task, $userId);

        if (! $assignment) {
            return;
        }

        if ($assignment->state === 'completed' || $assignment->state === 'rejected') {
            return;
        }

        $updates = [
            'state' => 'accepted',
        ];

        if (! $assignment->accepted_at) {
            $updates['accepted_at'] = now();
        }

        $assignment->update($updates);
    }

    /**
     * Mark the current user's assignment on this task as completed.
     */
    protected function markAssignmentCompleted(Task $task, int $userId): void
    {
        $assignment = $this->getActiveAssignment($task, $userId);

        if (! $assignment) {
            return;
        }

        $assignment->update([
            'state' => 'completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Synchronize global task state from assignment states for shared task safety.
     */
    protected function syncTaskStateFromAssignments(Task $task): void
    {
        $assignments = $task->taskAssignments()
            ->where('is_active', true)
            ->get(['id', 'state']);

        if ($assignments->isEmpty()) {
            return;
        }

        $hasInProgress = $assignments->contains(function (TaskAssignment $assignment) {
            return $assignment->state === 'in_progress';
        });

        if ($hasInProgress) {
            $this->updateTaskStateIfValid($task, 'InProgress');

            return;
        }

        $allTerminal = $assignments->every(function (TaskAssignment $assignment) {
            return in_array($assignment->state, ['completed', 'rejected'], true);
        });

        if ($allTerminal) {
            $this->updateTaskStateIfValid($task, 'Done');
        }
    }

    /**
     * Update task state only when it is a valid transition.
     */
    protected function updateTaskStateIfValid(Task $task, string $state): void
    {
        $task->refresh();

        if ($task->state === $state) {
            return;
        }

        if (! $task->isValidStateTransition($state)) {
            return;
        }

        $updatePayload = [
            'state' => $state,
        ];

        if ($state !== 'Done') {
            $updatePayload['completed_at'] = null;
        }

        $task->update($updatePayload);
    }

    /**
     * Resolve active assignment for a user and task.
     */
    protected function getActiveAssignment(Task $task, int $userId): ?TaskAssignment
    {
        return $task->taskAssignments()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();
    }
}
