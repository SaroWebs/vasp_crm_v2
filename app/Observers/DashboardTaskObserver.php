<?php

namespace App\Observers;

use App\Events\DashboardDataChanged;
use App\Models\Task;
use App\Models\User;

class DashboardTaskObserver
{
    public function created(Task $task): void
    {
        $this->broadcastChanges($task);
    }

    public function updated(Task $task): void
    {
        $this->broadcastChanges($task);
    }

    public function deleted(Task $task): void
    {
        $this->broadcastChanges($task);
    }

    public function restored(Task $task): void
    {
        $this->broadcastChanges($task);
    }

    private function broadcastChanges(Task $task): void
    {
        $assignedUserIds = $task->assignedUsers()
            ->pluck('users.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $userIds = array_filter([
            $task->created_by,
            ...$assignedUserIds,
        ]);

        $userIds = array_merge($userIds, $this->getPrivilegedUserIds());

        foreach (array_unique(array_map('intval', $userIds)) as $userId) {
            DashboardDataChanged::dispatch($userId);
        }
    }

    /**
     * @return array<int, int>
     */
    private function getPrivilegedUserIds(): array
    {
        return User::query()
            ->whereHas('roles', function ($query) {
                $query->whereIn('slug', ['super-admin', 'admin', 'manager', 'team-lead', 'hr']);
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
