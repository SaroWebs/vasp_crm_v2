<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SalesLead;
use App\Models\SalesLeadActivity;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesLeadPhaseFourTest extends TestCase
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

    public function test_admin_and_owner_can_view_sales_lead_detail(): void
    {
        $manager = $this->userWithRole('manager');
        $salesUser = $this->userWithRole('sales');
        $lead = SalesLead::factory()->for($salesUser, 'owner')->create([
            'organization_name' => 'Detail View School',
        ]);
        SalesLeadActivity::factory()->for($lead)->for($salesUser)->create([
            'activity_type' => 'meeting',
            'response_text' => 'Discussed ERP modules.',
        ]);

        $this->actingAs($manager, 'web')
            ->get("/admin/sales-leads/{$lead->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/sales-leads/Show')
                ->where('lead.organization_name', 'Detail View School')
                ->has('lead.activities', 1));

        $this->actingAs($salesUser, 'web')
            ->get("/my/sales-leads/{$lead->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('my/sales-leads/Show')
                ->where('lead.organization_name', 'Detail View School')
                ->has('lead.activities', 1));
    }

    public function test_sales_user_cannot_view_another_users_sales_lead_detail(): void
    {
        $owner = $this->userWithRole('sales');
        $otherSalesUser = $this->userWithRole('sales');
        $lead = SalesLead::factory()->for($owner, 'owner')->create();

        $this->actingAs($otherSalesUser, 'web')
            ->get("/my/sales-leads/{$lead->id}")
            ->assertNotFound();
    }

    public function test_follow_up_can_be_marked_complete_and_is_logged(): void
    {
        $salesUser = $this->userWithRole('sales');
        $lead = SalesLead::factory()->for($salesUser, 'owner')->create([
            'next_follow_up_at' => now()->addDay(),
            'latest_response' => 'Pending follow-up.',
        ]);

        $this->actingAs($salesUser, 'web')
            ->postJson("/my/sales-leads/{$lead->id}/complete-follow-up", [
                'response_text' => 'Completed after demo call.',
            ])
            ->assertOk()
            ->assertJsonPath('lead.next_follow_up_at', null)
            ->assertJsonPath('lead.latest_response', 'Completed after demo call.');

        $this->assertDatabaseHas('sales_lead_activities', [
            'sales_lead_id' => $lead->id,
            'user_id' => $salesUser->id,
            'activity_type' => 'note',
            'response_text' => 'Completed after demo call.',
        ]);
    }

    public function test_owner_can_close_sales_lead_as_won_without_creating_client(): void
    {
        $salesUser = $this->userWithRole('sales');
        $lead = SalesLead::factory()->for($salesUser, 'owner')->create([
            'status' => 'follow_up',
            'interest_level' => 'unclear',
            'next_follow_up_at' => now()->addDay(),
        ]);

        $this->actingAs($salesUser, 'web')
            ->postJson("/my/sales-leads/{$lead->id}/close-deal", [
                'response_text' => 'Agreement received from principal.',
            ])
            ->assertOk()
            ->assertJsonPath('lead.status', 'won')
            ->assertJsonPath('lead.interest_level', 'positive')
            ->assertJsonPath('lead.next_follow_up_at', null)
            ->assertJsonPath('lead.latest_response', 'Agreement received from principal.');

        $this->assertDatabaseHas('sales_leads', [
            'id' => $lead->id,
            'status' => 'won',
            'interest_level' => 'positive',
            'next_follow_up_at' => null,
        ]);
        $this->assertDatabaseHas('sales_lead_activities', [
            'sales_lead_id' => $lead->id,
            'user_id' => $salesUser->id,
            'activity_type' => 'note',
            'outcome_status' => 'won',
            'response_text' => 'Agreement received from principal.',
            'next_follow_up_at' => null,
        ]);
        $this->assertDatabaseCount('clients', 0);
    }

    public function test_sales_user_cannot_close_another_users_sales_lead(): void
    {
        $owner = $this->userWithRole('sales');
        $otherSalesUser = $this->userWithRole('sales');
        $lead = SalesLead::factory()->for($owner, 'owner')->create([
            'status' => 'follow_up',
        ]);

        $this->actingAs($otherSalesUser, 'web')
            ->postJson("/my/sales-leads/{$lead->id}/close-deal", [
                'response_text' => 'Trying to close.',
            ])
            ->assertNotFound();

        $this->assertDatabaseHas('sales_leads', [
            'id' => $lead->id,
            'status' => 'follow_up',
        ]);
    }

    public function test_permission_seeder_creates_sales_role_with_own_lead_permissions(): void
    {
        $this->seed(PermissionSeeder::class);

        $salesRole = Role::where('slug', 'sales')->firstOrFail();
        $permissionSlugs = $salesRole->permissions()->pluck('slug')->all();

        $this->assertTrue(Permission::where('slug', 'sales-lead.view_all')->exists());
        $this->assertContains('sales-lead.create', $permissionSlugs);
        $this->assertContains('sales-lead.read', $permissionSlugs);
        $this->assertContains('sales-lead.update', $permissionSlugs);
        $this->assertContains('sales-lead-activity.create', $permissionSlugs);
        $this->assertNotContains('sales-lead.view_all', $permissionSlugs);
        $this->assertNotContains('sales-lead.delete', $permissionSlugs);
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
