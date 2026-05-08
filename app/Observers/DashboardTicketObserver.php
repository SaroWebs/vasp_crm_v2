<?php

namespace App\Observers;

use App\Events\DashboardDataChanged;
use App\Models\Ticket;
use App\Models\User;

class DashboardTicketObserver
{
    public function created(Ticket $ticket): void
    {
        $this->broadcastChanges($ticket);
    }

    public function updated(Ticket $ticket): void
    {
        $this->broadcastChanges($ticket);
    }

    public function deleted(Ticket $ticket): void
    {
        $this->broadcastChanges($ticket);
    }

    public function restored(Ticket $ticket): void
    {
        $this->broadcastChanges($ticket);
    }

    private function broadcastChanges(Ticket $ticket): void
    {
        $userIds = array_filter([
            $ticket->created_by,
            $ticket->assigned_to,
            $ticket->approved_by,
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
