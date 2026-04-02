<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketAssignmentExternalFallbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_assignment_does_not_fall_back_when_whatsapp_succeeds(): void
    {
        $assignedByUser = User::factory()->create();
        $assignedUser = User::factory()->create();

        $service = new class extends NotificationService
        {
            public array $unifiedCalls = [];

            public array $notifyEmployeeCalls = [];

            public function sendUnifiedNotification(
                int $userId,
                string $type,
                string $title,
                string $message,
                array $data = []
            ): array {
                $this->unifiedCalls[] = func_get_args();

                return [
                    'pusher' => ['success' => true],
                    'whatsapp' => ['success' => true],
                ];
            }

            public function notifyEmployee(int $userId, string $subject, string $message, int $assignedByUserId): void
            {
                $this->notifyEmployeeCalls[] = func_get_args();
            }
        };

        $service->sendTicketAssignmentExternalNotification(
            123,
            'Broken printer',
            $assignedUser->id,
            $assignedByUser->id
        );

        $this->assertCount(1, $service->unifiedCalls);
        $this->assertCount(0, $service->notifyEmployeeCalls);
    }

    public function test_ticket_assignment_does_not_fall_back_to_employee_delivery_when_whatsapp_fails(): void
    {
        $assignedByUser = User::factory()->create();
        $assignedUser = User::factory()->create();

        $service = new class extends NotificationService
        {
            public array $unifiedCalls = [];

            public array $notifyEmployeeCalls = [];

            public function sendUnifiedNotification(
                int $userId,
                string $type,
                string $title,
                string $message,
                array $data = []
            ): array {
                $this->unifiedCalls[] = func_get_args();

                return [
                    'pusher' => ['success' => true],
                    'whatsapp' => ['success' => false],
                ];
            }

            public function notifyEmployee(int $userId, string $subject, string $message, int $assignedByUserId): void
            {
                $this->notifyEmployeeCalls[] = func_get_args();
            }
        };

        $service->sendTicketAssignmentExternalNotification(
            123,
            'Broken printer',
            $assignedUser->id,
            $assignedByUser->id
        );

        $this->assertCount(1, $service->unifiedCalls);
        $this->assertCount(0, $service->notifyEmployeeCalls);
    }
}
