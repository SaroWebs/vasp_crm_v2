<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;

class TaskActionAuthorizationService
{
    /**
     * Determine whether the user can manage any task.
     */
    public function canManageAnyTask(User $user): bool
    {
        return $user->hasRole(['super-admin', 'manager']);
    }

    /**
     * Determine whether the user can manage a specific task.
     */
    public function canManageTask(User $user, Task $task): bool
    {
        if ($this->canManageAnyTask($user)) {
            return true;
        }

        return (int) $task->created_by === (int) $user->id;
    }
}
