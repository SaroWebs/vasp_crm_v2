<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentUser;
use App\Models\Notification;
use App\Models\Task;
use App\Models\TaskForwarding;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $forwardings = TaskForwarding::where('task_id', $task->id)
            ->with(['fromUser', 'toUser', 'fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy', 'rejectedBy'])
            ->orderBy('created_at', 'asc')
            ->get();

        $forwardings->each(function (TaskForwarding $forwarding): void {
            $fromLabel = $forwarding->fromUser?->name
                ?? $forwarding->forwardedBy?->name
                ?? $forwarding->fromDepartment?->name
                ?? 'Unknown source';
            $toLabel = $forwarding->toUser?->name
                ?? $forwarding->toDepartment?->name
                ?? 'Unknown target';

            $forwarding->setAttribute('from_label', $fromLabel);
            $forwarding->setAttribute('to_label', $toLabel);
        });

        return response()->json(['data' => $forwardings]);
    }

    /**
     * Forward a task to another employee.
     */
    public function store(Request $request, Task $task)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'to_user_id' => 'required|exists:users,id',
            'reason' => 'required|string|max:1000',
            'priority' => 'nullable|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $targetUser = User::query()->find($validated['to_user_id']);
        if (! $targetUser) {
            return response()->json(['message' => 'Selected employee not found'], 422);
        }

        if ((int) $targetUser->id === (int) $user->id) {
            return response()->json(['message' => 'Cannot forward task to yourself'], 422);
        }

        if ($task->isAssignedToUser($targetUser->id)) {
            return response()->json(['message' => 'Task is already assigned to the selected employee'], 422);
        }

        $targetDepartmentId = DepartmentUser::query()
            ->where('user_id', $targetUser->id)
            ->value('department_id');

        try {
            DB::beginTransaction();

            // Create forwarding record
            $forwarding = TaskForwarding::create([
                'task_id' => $task->id,
                'from_user_id' => $user->id,
                'from_department_id' => $task->assigned_department_id,
                'to_user_id' => $targetUser->id,
                'to_department_id' => $targetDepartmentId,
                'forwarded_by' => $user->id,
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                'forwarded_at' => now(),
                'status' => 'pending',
            ]);

            // Unassign the forwarder from the task
            $task->unassignUser($user->id);

            // Assign the target user to the task
            $task->assignUser($targetUser->id, $user->id, $validated['notes'] ?? null);

            // Update task assignment
            $updateData = [
                'current_owner_kind' => 'USER',
                'current_owner_id' => $targetUser->id,
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
                'data' => $forwarding->load(['fromUser', 'toUser', 'fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy', 'rejectedBy']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'message' => 'Failed to forward task',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Accept a forwarded task.
     */
    public function accept(Request $request, TaskForwarding $taskForwarding)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is the target user
        $canAccept = (int) $taskForwarding->to_user_id === (int) $user->id || $user->hasRole('super-admin');

        if (! $canAccept) {
            return response()->json(['message' => 'You can only accept tasks forwarded to you'], 403);
        }

        try {
            DB::beginTransaction();

            $taskForwarding->update([
                'status' => 'accepted',
                'accepted_by' => $user->id,
                'accepted_at' => now(),
            ]);

            // Update task state to InProgress after acceptance
            $taskForwarding->task->update(['state' => 'InProgress']);

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
                    'accepted_by' => $user->id,
                ]
            );

            return response()->json([
                'message' => 'Task forwarding accepted successfully',
                'data' => $taskForwarding->fresh(['task', 'acceptedBy', 'fromDepartment', 'toDepartment', 'forwardedBy', 'rejectedBy']),
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'message' => 'Failed to accept task forwarding',
                'error' => $e->getMessage(),
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
            'rejection_reason' => 'required|string|max:1000',
        ]);

        if (! $user->hasPermission('task.update')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        // Check if user is the target user
        $canReject = (int) $taskForwarding->to_user_id === (int) $user->id || $user->hasRole('super-admin');

        if (! $canReject) {
            return response()->json(['message' => 'You can only reject tasks forwarded to you'], 403);
        }

        try {
            DB::beginTransaction();

            $taskForwarding->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['rejection_reason'],
                'rejected_by' => $user->id,
                'rejected_at' => now(),
            ]);

            // Unassign the current user from the task
            $taskForwarding->task->unassignUser($user->id);

            // Reassign the original forwarder back to the task
            $originalUser = $taskForwarding->from_user_id ?? $taskForwarding->forwarded_by;
            $taskForwarding->task->assignUser($originalUser, $user->id, "Task forwarding rejected: {$validated['rejection_reason']}");

            // Revert task back to original state
            $taskForwarding->task->update([
                'current_owner_kind' => 'USER',
                'current_owner_id' => $originalUser,
                'state' => 'Assigned',
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
                    'rejection_reason' => $validated['rejection_reason'],
                ]
            );

            return response()->json([
                'message' => 'Task forwarding rejected successfully',
                'data' => $taskForwarding->fresh(['task', 'rejectedBy', 'fromDepartment', 'toDepartment', 'forwardedBy', 'acceptedBy']),
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'message' => 'Failed to reject task forwarding',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send notifications for task forwarding.
     */
    private function sendForwardingNotifications(Task $task, TaskForwarding $forwarding, User $user): void
    {
        $toUser = User::query()->find($forwarding->to_user_id);
        if (! $toUser) {
            return;
        }

        $toDepartment = Department::find($forwarding->to_department_id);
        $fromDepartment = Department::find($forwarding->from_department_id);
        $toLabel = $toUser->name;
        $toDepartmentLabel = $toDepartment?->name ?? 'No department';
        $fromDepartmentLabel = $fromDepartment?->name ?? 'Unknown';

        Notification::createWorkflowNotification(
            $toUser->id,
            'task_forwarded',
            'Task Forwarded to You',
            "A task has been forwarded to you: {$task->title}",
            [
                'task_id' => $task->id,
                'forwarding_id' => $forwarding->id,
                'from_department' => $forwarding->from_department_id,
                'forwarded_by' => $user->id,
                'to_user_id' => $toUser->id,
            ]
        );

        $this->notificationService->sendTaskForwardExternalNotification(
            $task->id,
            $task->title,
            $fromDepartmentLabel,
            "{$toLabel} ({$toDepartmentLabel})",
            $user->id,
            $toUser->id
        );
    }

    /**
     * Get forwardings by department.
     */
    public function getByDepartment(Request $request, $departmentId)
    {
        $user = User::find(Auth::user()->id);

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $status = $request->query('status', 'all');

        $query = TaskForwarding::where(function ($query) use ($departmentId) {
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

        if (! $user->hasPermission('task.read')) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $status = $request->query('status', 'all');

        $query = TaskForwarding::where(function ($query) use ($userId) {
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

        if (! $user->hasPermission('task.read')) {
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

        if (! $user->hasPermission('task.read')) {
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
