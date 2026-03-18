<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\Department;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use App\Models\TaskForwarding;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TaskForwardingController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Display a listing of task forwarding records for a specific task.
     */
    public function index(Request $request, Task $task)
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $forwardings = TaskForwarding::where('task_id', $task->id)
            ->with(['fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy', 'rejectedBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $forwardings]);
    }

    /**
     * Forward a task to another department.
     */
    public function store(Request $request, Task $task)
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'to_department_id' => 'required|exists:departments,id',
            'reason' => 'required|string|max:1000',
            'priority' => 'nullable|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000'
        ]);

        // Check if user belongs to a department that can forward this task
        $userDepartments = $user->departments()->pluck('departments.id');
        if (!$userDepartments->contains($task->assigned_department_id) && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'You can only forward tasks from your department'], 403);
        }

        // Check if forwarding to the same department
        if ($validated['to_department_id'] == $task->assigned_department_id) {
            return response()->json(['message' => 'Cannot forward task to the same department'], 422);
        }

        try {
            DB::beginTransaction();

            // Create forwarding record
            $forwarding = TaskForwarding::create([
                'task_id' => $task->id,
                'from_department_id' => $task->assigned_department_id,
                'to_department_id' => $validated['to_department_id'],
                'forwarded_by' => $user->id,
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'pending'
            ]);

            // Update task assignment
            $updateData = [
                'assigned_department_id' => $validated['to_department_id'],
            ];

            if (isset($validated['priority'])) {
                $updateData['priority'] = $validated['priority'];
            }

            if (isset($validated['due_date'])) {
                $updateData['due_date'] = $validated['due_date'];
            }

            $task->update($updateData);

            // Send notifications
            $this->sendForwardingNotifications($task, $forwarding, $user);

            DB::commit();

            return response()->json([
                'message' => 'Task forwarded successfully',
                'data' => $forwarding->load(['fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy', 'rejectedBy'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Failed to forward task',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Accept a forwarded task.
     */
    public function accept(Request $request, TaskForwarding $taskForwarding)
    {
        $user = User::find(Auth::user()->id);

        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user belongs to the target department
        $userDepartments = $user->departments()->pluck('departments.id');
        if (!$userDepartments->contains($taskForwarding->to_department_id) && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'You can only accept tasks for your department'], 403);
        }

        try {
            DB::beginTransaction();

            $taskForwarding->update([
                'status' => 'accepted',
                'accepted_by' => $user->id,
                'accepted_at' => now()
            ]);

            // Update task status to in-progress
            $taskForwarding->task->update(['status' => 'in-progress']);

            DB::commit();

            // Send notification
            Notification::createWorkflowNotification(
                $taskForwarding->forwarded_by,
                'task_forward_accepted',
                'Task Forward Accepted',
                "Your forwarded task '{$taskForwarding->task->title}' has been accepted by {$user->name}.",
                [
                    'task_id' => $taskForwarding->task_id,
                    'forwarding_id' => $taskForwarding->id,
                    'accepted_by' => $user->id
                ]
            );

            return response()->json([
                'message' => 'Task forwarding accepted successfully',
                'data' => $taskForwarding->fresh(['task', 'acceptedBy', 'fromDepartment', 'toDepartment', 'forwardedBy', 'rejectedBy'])
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Failed to accept task forwarding',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a forwarded task.
     */
    public function reject(Request $request, TaskForwarding $taskForwarding)
    {
        $user = User::find(Auth::user()->id);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000'
        ]);

        if (!$user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user belongs to the target department
        $userDepartments = $user->departments()->pluck('departments.id');
        if (!$userDepartments->contains($taskForwarding->to_department_id) && !$user->hasRole('superadmin')) {
            return response()->json(['message' => 'You can only reject tasks for your department'], 403);
        }

        try {
            DB::beginTransaction();

            $taskForwarding->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'],
                'rejected_by' => $user->id,
                'rejected_at' => now()
            ]);

            // Revert task back to original department
            $taskForwarding->task->update([
                'assigned_department_id' => $taskForwarding->from_department_id,
                'status' => 'pending'
            ]);

            DB::commit();

            // Send notification
            Notification::createWorkflowNotification(
                $taskForwarding->forwarded_by,
                'task_forward_rejected',
                'Task Forward Rejected',
                "Your forwarded task '{$taskForwarding->task->title}' has been rejected. Reason: {$validated['rejection_reason']}",
                [
                    'task_id' => $taskForwarding->task_id,
                    'forwarding_id' => $taskForwarding->id,
                    'rejected_by' => $user->id,
                    'rejection_reason' => $validated['rejection_reason']
                ]
            );

            return response()->json([
                'message' => 'Task forwarding rejected successfully',
                'data' => $taskForwarding->fresh(['task', 'rejectedBy', 'fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy'])
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Failed to reject task forwarding',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send notifications for task forwarding.
     */
    private function sendForwardingNotifications($task, $forwarding, $user)
    {
        $toDepartment = Department::find($forwarding->to_department_id);
        $fromDepartment = Department::find($forwarding->from_department_id);

        // Notify target department users
        $targetUsers = $toDepartment->users()->get();
        foreach ($targetUsers as $targetUser) {
            Notification::createWorkflowNotification(
                $targetUser->id,
                'task_forwarded',
                'Task Forwarded to Your Department',
                "A new task has been forwarded to your department: {$task->title}",
                [
                    'task_id' => $task->id,
                    'forwarding_id' => $forwarding->id,
                    'from_department' => $forwarding->from_department_id,
                    'forwarded_by' => $user->id
                ]
            );

            // Send external notification (SMS/Email) to the user
            $this->notificationService->sendTaskForwardExternalNotification(
                $task->id,
                $task->title,
                $fromDepartment->name ?? 'Unknown',
                $toDepartment->name,
                $user->id,
                $targetUser->id
            );
        }

        // Notify department managers
        $managers = $toDepartment->getManagers();
        foreach ($managers as $manager) {
            Notification::createWorkflowNotification(
                $manager->id,
                'task_forwarded_manager',
                'Task Forwarded - Manager Notification',
                "Task '{$task->title}' has been forwarded to your department by {$user->name}.",
                [
                    'task_id' => $task->id,
                    'forwarding_id' => $forwarding->id,
                    'requires_approval' => true
                ]
            );

            // Send external notification (SMS/Email) to the manager
            $this->notificationService->sendTaskForwardExternalNotification(
                $task->id,
                $task->title,
                $fromDepartment->name ?? 'Unknown',
                $toDepartment->name,
                $user->id,
                $manager->id
            );
        }
    }

    /**
     * Get forwardings by department.
     */
    public function getByDepartment(Request $request, $departmentId)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $status = $request->query('status', 'all');

        $query = TaskForwarding::where(function($query) use ($departmentId) {
            $query->where('from_department_id', $departmentId)
                  ->orWhere('to_department_id', $departmentId);
        });

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $forwardings = $query->with(['fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy', 'rejectedBy', 'task'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $forwardings,
        ]);
    }

    /**
     * Get forwardings by user.
     */
    public function getByUser(Request $request, $userId)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $status = $request->query('status', 'all');

        $query = TaskForwarding::where(function($query) use ($userId) {
            $query->where('forwarded_by', $userId)
                  ->orWhere('accepted_by', $userId)
                  ->orWhere('rejected_by', $userId);
        });

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $forwardings = $query->with(['fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy', 'rejectedBy', 'task'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $forwardings,
        ]);
    }

    /**
     * Get pending forwardings for a department.
     */
    public function getPendingForDepartment(Request $request, $departmentId)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $forwardings = TaskForwarding::where('to_department_id', $departmentId)
            ->where('status', 'pending')
            ->with(['fromDepartment', 'toDepartment', 'forwardedBy', 'task'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $forwardings,
        ]);
    }

    /**
     * Get forwarding statistics for a department.
     */
    public function getStatistics(Request $request, $departmentId)
    {
        $user = User::find(Auth::user()->id);
        
        if (!$user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $stats = [
            'total_forwarded' => TaskForwarding::where('from_department_id', $departmentId)->count(),
            'total_received' => TaskForwarding::where('to_department_id', $departmentId)->count(),
            'pending' => TaskForwarding::where('to_department_id', $departmentId)->where('status', 'pending')->count(),
            'accepted' => TaskForwarding::where('to_department_id', $departmentId)->where('status', 'accepted')->count(),
            'rejected' => TaskForwarding::where('to_department_id', $departmentId)->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
