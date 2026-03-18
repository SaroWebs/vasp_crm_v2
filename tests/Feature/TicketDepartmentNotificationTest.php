<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientProductInstance;
use App\Models\Department;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketDepartmentNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_support_department_users_receive_notification_when_support_ticket_is_created(): void
    {
        config()->set('tickets.notify_department_by_category', ['support' => 'support']);

        $department = Department::create([
            'name' => 'Support',
            'slug' => 'support',
            'status' => 'active',
        ]);

        $employee = User::factory()->create();
        $department->users()->attach($employee->id, [
            'assigned_at' => now(),
            'assigned_by' => null,
        ]);

        $client = Client::create([
            'name' => 'Test Client',
            'email' => 'client@example.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $product = Product::create(['name' => 'Test Product', 'status' => 'active']);
        $instance = ClientProductInstance::create([
            'client_id' => $client->id,
            'product_id' => $product->id,
            'variant_name' => 'Test Variant',
            'deployment_status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'client_product_instance_id' => $instance->id,
            'ticket_number' => 'test-support-001',
            'title' => 'Need help',
            'description' => 'Support needed',
            'category' => 'support',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $notification = Notification::query()
            ->where('type', 'App\Notifications\TicketCreatedNotification')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $employee->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($notification);
        $this->assertSame($ticket->id, $notification->data['ticket_id']);
        $this->assertSame('support', $notification->data['department_slug'] ?? 'support');
    }
}
