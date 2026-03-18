<?php

namespace App\Observers;

use App\Models\Department;
use App\Models\Ticket;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class TicketObserver
{
    public function __construct(private readonly NotificationService $notificationService)
    {
    }

    public function created(Ticket $ticket): void
    {
        $category = $ticket->category;
        $departmentSlug = config("tickets.notify_department_by_category.{$category}");

        if (!$departmentSlug) {
            return;
        }

        $department = Department::query()
            ->where('slug', $departmentSlug)
            ->where('status', 'active')
            ->first();

        if (!$department) {
            Log::warning('Ticket created but department slug not found/active for notifications.', [
                'ticket_id' => $ticket->id,
                'ticket_category' => $category,
                'department_slug' => $departmentSlug,
            ]);
            return;
        }

        $userIds = $department->users()->pluck('users.id')->all();
        if (!$userIds) {
            return;
        }

        $title = 'New Ticket';
        $message = "New {$department->name} ticket created: {$ticket->title}";

        $clientName = $ticket->client?->name;
        if ($clientName) {
            $message .= " (Client: {$clientName})";
        }

        if ($ticket->ticket_number) {
            $message .= " [{$ticket->ticket_number}]";
        }

        $data = [
            'ticket_id' => $ticket->id,
            'ticket_title' => $ticket->title,
            'ticket_number' => $ticket->ticket_number,
            'ticket_category' => $category,
            'client_id' => $ticket->client_id,
            'client_name' => $clientName,
            'department_id' => $department->id,
            'department_name' => $department->name,
            'department_slug' => $departmentSlug,
        ];

        foreach ($userIds as $userId) {
            $this->notificationService->sendToUser(
                (int) $userId,
                'App\Notifications\TicketCreatedNotification',
                $title,
                $message,
                $data
            );
        }
    }
}
