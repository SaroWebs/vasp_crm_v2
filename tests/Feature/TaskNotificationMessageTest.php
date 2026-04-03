<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TaskNotificationMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_assignment_notification_uses_admin_task_url(): void
    {
        $assigner = User::factory()->create();
        $assignee = User::factory()->create();

        $service = new class extends NotificationService
        {
            /** @var array<int, array<string, mixed>> */
            public array $unifiedNotificationCalls = [];

            public function sendUnifiedNotification(
                int $userId,
                string $type,
                string $title,
                string $message,
                array $data = []
            ): array {
                $this->unifiedNotificationCalls[] = [
                    'user_id' => $userId,
                    'type' => $type,
                    'title' => $title,
                    'message' => $message,
                    'data' => $data,
                ];

                return [
                    'whatsapp' => [
                        'success' => true,
                    ],
                ];
            }
        };

        $service->sendTaskAssignmentExternalNotification(42, 'Printer offline', $assignee->id, $assigner->id);

        $this->assertCount(1, $service->unifiedNotificationCalls);
        $this->assertSame($assignee->id, $service->unifiedNotificationCalls[0]['user_id']);
        $this->assertSame('New Task Assigned', $service->unifiedNotificationCalls[0]['title']);
        $this->assertStringContainsString(config('app.url').'/admin/tasks/42', $service->unifiedNotificationCalls[0]['message']);
        $this->assertStringNotContainsString('/my/tasks/42', $service->unifiedNotificationCalls[0]['message']);
    }

    public function test_admin_task_status_update_triggers_terminal_state_notification(): void
    {
        $this->withoutMiddleware();

        $adminRole = Role::create([
            'name' => 'super-admin',
            'slug' => 'super-admin',
            'guard_name' => 'web',
            'description' => 'Super admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole->id);

        $task = Task::query()->create([
            'title' => 'Status change task',
            'task_code' => 'TASK-STATUS-001',
            'state' => 'Assigned',
            'created_by' => $admin->id,
        ]);

        $service = new class extends NotificationService
        {
            /** @var array<int, array<string, mixed>> */
            public array $completionCalls = [];

            public function sendTaskCompletionExternalNotification(int $taskId, string $taskTitle, string $newStatus, int $changedByUserId): void
            {
                $this->completionCalls[] = [
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'new_status' => $newStatus,
                    'changed_by_user_id' => $changedByUserId,
                ];
            }
        };

        $this->app->instance(NotificationService::class, $service);

        $response = $this->actingAs($admin, 'web')->patchJson("/admin/tasks/{$task->id}/status", [
            'state' => 'Done',
        ]);

        $response->assertOk();

        $this->assertCount(1, $service->completionCalls);
        $this->assertSame($task->id, $service->completionCalls[0]['task_id']);
        $this->assertSame('Status change task', $service->completionCalls[0]['task_title']);
        $this->assertSame('Done', $service->completionCalls[0]['new_status']);
        $this->assertSame($admin->id, $service->completionCalls[0]['changed_by_user_id']);
    }

    #[DataProvider('terminalStateProvider')]
    public function test_task_completion_notification_uses_employee_name_and_admin_task_url(string $state, string $expectedLabel): void
    {
        $managerRole = Role::create([
            'name' => 'manager',
            'slug' => 'manager',
            'guard_name' => 'web',
            'description' => 'Manager role',
            'is_default' => false,
            'level' => 2,
        ]);

        $department = Department::create([
            'name' => 'Operations',
            'slug' => 'operations',
            'status' => 'active',
        ]);

        $managerOne = User::factory()->create([
            'phone' => '9876543210',
        ]);
        $managerOne->roles()->attach($managerRole->id);

        $managerTwo = User::factory()->create([
            'phone' => '9876543211',
        ]);
        $managerTwo->roles()->attach($managerRole->id);

        $actor = User::factory()->create();

        Employee::create([
            'name' => 'Alex Employee',
            'email' => 'alex.employee@example.com',
            'phone' => '9123456780',
            'department_id' => $department->id,
            'user_id' => $actor->id,
        ]);

        $service = new class extends NotificationService
        {
            /** @var array<int, array<string, string>> */
            public array $whatsappMessages = [];

            public function sendWhatsApp(string $phone, string $message): bool
            {
                $this->whatsappMessages[] = [
                    'phone' => $phone,
                    'message' => $message,
                ];

                return true;
            }
        };

        $service->sendTaskCompletionExternalNotification(99, 'Annual review', $state, $actor->id);

        $this->assertCount(2, $service->whatsappMessages);

        foreach ($service->whatsappMessages as $notification) {
            $this->assertSame("Task {$expectedLabel}", strtok($notification['message'], "\n"));
            $this->assertStringContainsString("Task {$expectedLabel}", $notification['message']);
            $this->assertStringContainsString("Task 'Annual review' has been {$expectedLabel} by Alex Employee", $notification['message']);
            $this->assertStringContainsString(config('app.url').'/admin/tasks/99', $notification['message']);
            $this->assertStringNotContainsString('/my/tasks/99', $notification['message']);
        }
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function terminalStateProvider(): array
    {
        return [
            'done' => ['Done', 'Completed'],
            'cancelled' => ['Cancelled', 'Cancelled'],
            'rejected' => ['Rejected', 'Rejected'],
        ];
    }
}
