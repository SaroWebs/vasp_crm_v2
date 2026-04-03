<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserTaskController extends TimeTrackingController
{
    /**
     * Get tasks with time entries for the current user and specific date.
     *
     */
    public function getTasksWithTimeEntries(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $date = $request->input('date', now()->toDateString());
        $userTasks = $user->assignedTasks()
            ->with(['timeEntries' => function($query) use ($date) {
                $query->whereDate('start_time', $date)
                      ->where('is_active', false);
            },'slaPolicy'])
            ->get();
            
        // Filter tasks that have time entries for the selected date
        $tasksWithTimeEntries = $userTasks->filter(function($task) {
            return $task->timeEntries->count() > 0;
        });
        
        return response()->json([
            'tasks' => $tasksWithTimeEntries,
            'date' => $date
        ]);
    }

    /**
     * Get tasks assigned to the current user.
     * Sorted by: overdue tasks first, then by due date ascending.
     */
    public function getMyTasks()
    {
        $user = Auth::user();
        $tasks = Task::whereHas('assignedUsers', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['taskType','slaPolicy', 'project', 'createdBy', 'assignedUsers'])
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
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBoardTasks()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Terminal states that indicate task completion
        $terminalStates = ['Done', 'Cancelled', 'Rejected'];

        $tasks = Task::whereHas('assignedUsers', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with([
                'createdBy:id,name',
                'assignedDepartment:id,name',
                'assignedUsers:id,name',
                'ticket:id,ticket_number,title',
                'taskType:id,name,code',
                'slaPolicy:id,name,priority',
                'timeEntries:id,task_id,user_id,start_time,end_time,is_active'
            ])
            ->where(function($query) use ($terminalStates) {
                $query->whereNotIn('state', $terminalStates)
                    ->orWhere(function($subQuery) use ($terminalStates) {
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
            'data' => $tasks
        ]);
    }
}
