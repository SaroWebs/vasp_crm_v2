<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskForwarding;
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
            }, 'slaPolicy', 'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,status,created_at,forwarded_at', 'forwardings.fromUser:id,name', 'forwardings.toUser:id,name', 'forwardings.fromDepartment:id,name', 'forwardings.toDepartment:id,name', 'forwardings.forwardedBy:id,name', 'timelineEvents' => function ($query) use ($startOfDay, $endOfDay) {
                $query
                    ->select([
                        'id',
                        'task_id',
                        'user_id',
                        'event_type',
                        'event_name',
                        'event_description',
                        'event_date',
                        'is_milestone',
                        'milestone_type',
                        'target_date',
                        'is_completed',
                        'progress_percentage',
                        'metadata',
                    ])
                    ->where('event_type', '!=', 'daily_report')
                    ->whereBetween('event_date', [$startOfDay, $endOfDay])
                    ->orderBy('event_date', 'asc');
            }])
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

            $timelineEventLines = $task->timelineEvents
                ->map(function ($event) {
                    $time = Carbon::parse($event->event_date)->format('H:i');
                    $eventType = trim((string) $event->event_type);
                    $eventName = trim((string) $event->event_name);
                    $eventDescription = trim((string) ($event->event_description ?? ''));
                    $status = $event->is_completed ? 'Completed' : 'Pending';

                    $parts = [];
                    $parts[] = '<strong>['.e($status).']</strong>';
                    $parts[] = '<span>'.e($eventName).'</span>';
                    if ($eventDescription !== '') {
                        $parts[] = '<span>: '.e($eventDescription).'</span>';
                    }

                    return implode(' ', $parts);
                })
                ->filter()
                ->values()
                ->all();

            $task->default_remarks = $timelineEventLines === []
                ? ''
                : '<ul><li>'.implode('</li><li>', $timelineEventLines).'</li></ul>';
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
            ->with([
                'taskType',
                'slaPolicy',
                'project',
                'createdBy',
                'assignedUsers',
                'timeEntries:id,task_id,user_id,start_time,end_time,is_active',
                'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,status,created_at,forwarded_at',
                'forwardings.fromUser:id,name',
                'forwardings.toUser:id,name',
                'forwardings.fromDepartment:id,name',
                'forwardings.toDepartment:id,name',
                'forwardings.forwardedBy:id,name',
            ])
            ->orderByRaw("CASE 
                WHEN due_at < NOW() AND state != 'Done' THEN 1 
                WHEN due_at >= NOW() OR due_at IS NULL THEN 2 
                ELSE 3 END")
            ->orderBy('due_at', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        $tasks->each(function (Task $task) use ($user) {
            $activeEntries = $task->timeEntries->where('is_active', true);
            $myActiveEntry = $activeEntries->firstWhere('user_id', $user->id);

            $task->setAttribute('my_active_entry', $myActiveEntry);
            $task->setAttribute('my_is_tracking', $myActiveEntry !== null);
            $task->setAttribute(
                'other_active_users_count',
                $activeEntries
                    ->where('user_id', '!=', $user->id)
                    ->pluck('user_id')
                    ->unique()
                    ->count()
            );

            $this->appendForwardingMeta($task);
        });

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
                'forwardings:id,task_id,from_user_id,to_user_id,from_department_id,to_department_id,forwarded_by,status,created_at,forwarded_at',
                'forwardings.fromUser:id,name',
                'forwardings.toUser:id,name',
                'forwardings.fromDepartment:id,name',
                'forwardings.toDepartment:id,name',
                'forwardings.forwardedBy:id,name',
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

        $tasks->each(function (Task $task) use ($user) {
            $activeEntries = $task->timeEntries->where('is_active', true);
            $myActiveEntry = $activeEntries->firstWhere('user_id', $user->id);

            $task->setAttribute('my_active_entry', $myActiveEntry);
            $task->setAttribute('my_is_tracking', $myActiveEntry !== null);
            $task->setAttribute(
                'other_active_users_count',
                $activeEntries
                    ->where('user_id', '!=', $user->id)
                    ->pluck('user_id')
                    ->unique()
                    ->count()
            );

            $this->appendForwardingMeta($task);
        });

        return response()->json([
            'data' => $tasks,
        ]);
    }

    /**
     * Append forwarding metadata used by board cards and task details.
     */
    private function appendForwardingMeta(Task $task): void
    {
        $forwardings = $task->relationLoaded('forwardings')
            ? $task->forwardings
            : $task->forwardings()
                ->with(['fromUser:id,name', 'toUser:id,name', 'fromDepartment:id,name', 'toDepartment:id,name', 'forwardedBy:id,name'])
                ->get();

        $sortedForwardings = $forwardings
            ->sortBy(function (TaskForwarding $forwarding): string {
                return (string) ($forwarding->forwarded_at ?? $forwarding->created_at);
            })
            ->values();

        $waterfall = $sortedForwardings->map(function (TaskForwarding $forwarding): array {
            $fromUserName = $forwarding->fromUser?->name ?? $forwarding->forwardedBy?->name;
            $toUserName = $forwarding->toUser?->name;
            $fromDepartmentName = $forwarding->fromDepartment?->name;
            $toDepartmentName = $forwarding->toDepartment?->name;

            $fromLabel = $fromUserName
                ?? $fromDepartmentName
                ?? 'Unknown source';
            $toLabel = $toUserName
                ?? $toDepartmentName
                ?? 'Unknown target';

            return [
                'id' => $forwarding->id,
                'from_label' => $fromLabel,
                'to_label' => $toLabel,
                'from_user' => $fromUserName,
                'to_user' => $toUserName,
                'from_department' => $fromDepartmentName,
                'to_department' => $toDepartmentName,
                'status' => $forwarding->status,
                'forwarded_at' => optional($forwarding->forwarded_at)->toDateTimeString() ?? optional($forwarding->created_at)->toDateTimeString(),
            ];
        })->all();

        $task->setAttribute('has_forwardings', count($waterfall) > 0);
        $task->setAttribute('forwardings_count', count($waterfall));
        $task->setAttribute('forwarding_waterfall', $waterfall);
    }
}
