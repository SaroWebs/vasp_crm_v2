<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Role;
use App\Models\SalesLead;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesLeadPhaseFiveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            VerifyCsrfToken::class,
            ValidateUserSession::class,
        ]);
    }

    public function test_admin_report_returns_employee_product_status_and_followup_counts(): void
    {
        $manager = $this->userWithRole('manager');
        $salesUser = $this->userWithRole('sales');
        $product = Product::create(['name' => 'School ERP', 'status' => 'active']);

        $lead = SalesLead::factory()->for($salesUser, 'owner')->create([
            'product_id' => $product->id,
            'interest_level' => 'positive',
            'status' => 'won',
        ]);
        $lead->activities()->create([
            'user_id' => $salesUser->id,
            'activity_type' => 'note',
            'outcome_status' => 'won',
            'response_text' => 'Follow-up completed.',
            'activity_at' => now(),
        ]);

        $this->actingAs($manager, 'web')
            ->getJson('/admin/data/sales-leads/report')
            ->assertOk()
            ->assertJsonPath('by_employee.0.owner_user_id', $salesUser->id)
            ->assertJsonPath('by_employee.0.total', 1)
            ->assertJsonPath('by_employee.0.positive', 1)
            ->assertJsonPath('by_employee.0.won', 1)
            ->assertJsonPath('by_product.0.product_id', $product->id)
            ->assertJsonPath('followups_completed', 1);
    }

    public function test_admin_can_export_sales_leads_csv(): void
    {
        $manager = $this->userWithRole('manager');
        SalesLead::factory()->create([
            'organization_name' => 'CSV Export School',
            'interest_level' => 'positive',
        ]);

        $response = $this->actingAs($manager, 'web')
            ->get('/admin/sales-leads/export');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
        $this->assertStringContainsString('sales-leads-', $response->headers->get('content-disposition'));
        $this->assertStringContainsString('CSV Export School', $response->streamedContent());
    }

    public function test_admin_can_convert_won_lead_to_client_without_client_users(): void
    {
        $manager = $this->userWithRole('manager');
        $product = Product::create(['name' => 'Website', 'status' => 'active']);
        $lead = SalesLead::factory()->create([
            'product_id' => $product->id,
            'organization_name' => 'Convert Me Pvt Ltd',
            'contact_email' => 'buyer@example.com',
            'contact_phone' => '9876543210',
            'location' => 'Kochi',
            'status' => 'won',
        ]);

        $this->actingAs($manager, 'web')
            ->postJson("/admin/sales-leads/{$lead->id}/convert")
            ->assertCreated()
            ->assertJsonPath('client.name', 'Convert Me Pvt Ltd')
            ->assertJsonPath('lead.status', 'won');

        $client = Client::where('name', 'Convert Me Pvt Ltd')->firstOrFail();
        $this->assertSame('buyer@example.com', $client->email);
        $this->assertSame($product->id, $client->product_id);
        $this->assertDatabaseHas('sales_leads', [
            'id' => $lead->id,
            'converted_client_id' => $client->id,
            'status' => 'won',
        ]);
        $this->assertSame(0, $client->organizationUsers()->count());
    }

    public function test_admin_can_send_overdue_followup_reminders(): void
    {
        $manager = $this->userWithRole('manager');
        $salesUser = $this->userWithRole('sales');
        SalesLead::factory()->for($salesUser, 'owner')->create([
            'organization_name' => 'Overdue Reminder School',
            'next_follow_up_at' => now()->subDay(),
            'status' => 'follow_up',
        ]);

        $this->actingAs($manager, 'web')
            ->postJson('/admin/sales-leads/reminders/send')
            ->assertOk()
            ->assertJsonPath('sent', 1);

        $notification = Notification::query()
            ->where('type', 'App\Notifications\SalesLeadFollowUpReminderNotification')
            ->firstOrFail();

        $this->assertTrue($notification->isOwnedByUser($salesUser->id));
        $this->assertSame('Overdue Reminder School', $notification->data['organization_name']);
    }

    private function userWithRole(string $roleSlug): User
    {
        $role = Role::firstOrCreate(
            ['slug' => $roleSlug],
            [
                'name' => str($roleSlug)->headline()->toString(),
                'guard_name' => 'web',
            ]
        );

        $user = User::factory()->create(['status' => 'active']);
        $user->assignRole($role);

        return $user;
    }
}
