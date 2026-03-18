<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function __construct()
    {
        // $this->middleware(['auth', 'admin']);
    }

    /**
     * Display a listing of notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Notification::query()->forUser($user->id);

        // Apply filters
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'read') {
                $query->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id)
                        ->where('users_notifications.read', true);
                });
            }

            if ($request->status === 'unread') {
                $query->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id)
                        ->where('users_notifications.read', false);
                });
            }
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();
        $notifications->setCollection(
            $notifications->getCollection()->map(function (Notification $notification) use ($user) {
                return $notification->toFrontend($user->id);
            })
        );

        // Get notification counts
        $counts = [
            'unread' => Notification::getUnreadCountForUser($user->id),
            'read' => Notification::whereHas('users', function ($query) use ($user) {
                $query->where('users.id', $user->id)
                    ->where('users_notifications.read', true);
            })->count(),
            'total' => Notification::whereHas('users', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })->count(),
        ];

        return Inertia::render('notifications/Index', [
            'notifications' => $notifications,
            'filters' => $request->only(['status', 'type']),
            'counts' => $counts
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, Notification $notification)
    {
        $userId = Auth::id();

        if (!$notification->isOwnedByUser($userId)) {
            abort(403, 'Unauthorized');
        }

        $notification->markAsReadForUser($userId);

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Notification marked as read.']);
        }

        return back()->with('success', 'Notification marked as read.');
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();

        Notification::whereHas('users', function ($query) use ($user) {
            $query->where('users.id', $user->id)
                ->where('users_notifications.read', false);
        })
            ->get()
            ->each(function ($notification) use ($user) {
                $notification->markAsReadForUser($user->id);
            });

        if ($request->expectsJson()) {
            return response()->json(['message' => 'All notifications marked as read.']);
        }

        return back()->with('success', 'All notifications marked as read.');
    }

    /**
     * Get unread notification count for the authenticated user.
     */
    public function getUnreadCount(Request $request)
    {
        $user = Auth::user();

        $count = Notification::getUnreadCountForUser($user->id);

        return response()->json(['unread_count' => $count]);
    }

    /**
     * Get recent notifications for the authenticated user.
     */
    public function getRecent(Request $request)
    {
        $user = Auth::user();
        $limit = $request->get('limit', 5);

        $notifications = Notification::getRecentNotificationsForUser($user->id, $limit)
            ->map(function (Notification $notification) use ($user) {
                return $notification->toFrontend($user->id);
            })
            ->values();

        return response()->json($notifications);
    }

    /**
     * Get notification data for dropdown menu.
     */
    public function data(Request $request)
    {
        $user = Auth::user();
        $limit = $request->get('limit', 10);

        $notifications = Notification::getRecentNotificationsForUser($user->id, $limit)
            ->map(function (Notification $notification) use ($user) {
                return $notification->toFrontend($user->id);
            })
            ->values();

        $total = Notification::whereHas('users', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })->count();

        $total_unread = Notification::getUnreadCountForUser($user->id);

        return response()->json([
            'notifications' => $notifications,
            'data' => $notifications,
            'total' => $total,
            'total_unread' => $total_unread,
            'unread_count' => $total_unread,
        ]);
    }


    /**
     * Delete a notification.
     */
    public function destroy(Request $request, Notification $notification)
    {
        $userId = Auth::id();

        if (!$notification->isOwnedByUser($userId)) {
            abort(403, 'Unauthorized');
        }

        $notification->users()->detach($userId);

        if (!$notification->users()->exists()) {
            $notification->delete();
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Notification deleted.']);
        }

        return back()->with('success', 'Notification deleted.');
    }

    /**
     * Bulk delete notifications.
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'exists:notifications,id'
        ]);

        $notifications = Notification::query()
            ->forUser($user->id)
            ->whereIn('id', $validated['notification_ids'])
            ->get();

        $notifications->each(function (Notification $notification) use ($user) {
            $notification->users()->detach($user->id);

            if (!$notification->users()->exists()) {
                $notification->delete();
            }
        });

        return response()->json(['message' => 'Notifications deleted']);
    }

    /**
     * Bulk mark notifications as read.
     */
    public function bulkMarkAsRead(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'exists:notifications,id'
        ]);

        Notification::query()
            ->forUser($user->id)
            ->whereIn('id', $validated['notification_ids'])
            ->get()
            ->each(function (Notification $notification) use ($user) {
                $notification->markAsReadForUser($user->id);
            });

        return response()->json(['message' => 'Notifications marked as read']);
    }

    /**
     * Create workflow notification (internal method).
     */
    public static function createWorkflowNotification($userId, $type, $title, $message, $data = [])
    {
        return Notification::createWorkflowNotification($userId, $type, $title, $message, $data);
    }

    /**
     * Send notification to department users.
     */
    public static function notifyDepartment($departmentId, $type, $title, $message, $data = [])
    {
        $department = \App\Models\Department::find($departmentId);
        if (!$department) return [];

        $userIds = $department->users()->pluck('users.id')->toArray();
        return Notification::notifyUsers($userIds, $type, $title, $message, $data);
    }

    /**
     * Send notification to department managers.
     */
    public static function notifyDepartmentManagers($departmentId, $type, $title, $message, $data = [])
    {
        $department = \App\Models\Department::find($departmentId);
        if (!$department) return [];

        $managerIds = $department->getManagers()->pluck('id')->toArray();
        return Notification::notifyUsers($managerIds, $type, $title, $message, $data);
    }
}
