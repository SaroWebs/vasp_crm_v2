<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Product;
use App\Models\Role;
use App\Models\SalesLead;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesLeadPhaseThreeTest extends TestCase
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

    public function test_admin_can_view_all_sales_leads_and_filter_by_employee(): void
    {
        $admin = $this->userWithRole('manager');
        [$salesUser, $otherSalesUser] = User::factory()->count(2)->create(['status' => 'active']);

        $includedLead = SalesLead::factory()->for($salesUser, 'owner')->create([
            'organization_name' => 'Included School',
            'interest_level' => 'positive',
        ]);
        SalesLead::factory()->for($otherSalesUser, 'owner')->create([
            'organization_name' => 'Other School',
        ]);

        $this->actingAs($admin, 'web')
            ->getJson("/admin/data/sales-leads?owner_user_id={$salesUser->id}")
            ->assertOk()
            ->assertJsonPath('leads.0.id', $includedLead->id)
            ->assertJsonPath('metrics.total', 1)
            ->assertJsonPath('metrics.positive', 1);
    }

    public function test_sales_user_can_create_list_and_update_only_own_leads(): void
    {
        $salesUser = $this->userWithRole('sales');
        $otherSalesUser = $this->userWithRole('sales');
        $product = Product::create([
            'name' => 'School ERP',
            'status' => 'active',
        ]);
        $otherLead = SalesLead::factory()->for($otherSalesUser, 'owner')->create();

        $createResponse = $this->actingAs($salesUser, 'web')
            ->postJson('/my/sales-leads', [
                'product_id' => $product->id,
                'organization_name' => 'Green Valley School',
                'organization_type' => 'school',
                'contact_person_name' => 'Mary Thomas',
                'interest_level' => 'unclear',
                'status' => 'new',
            ])
            ->assertCreated()
            ->assertJsonPath('lead.owner_user_id', $salesUser->id);

        $leadId = $createResponse->json('lead.id');

        $this->actingAs($salesUser, 'web')
            ->getJson('/data/my/sales-leads')
            ->assertOk()
            ->assertJsonCount(1, 'leads')
            ->assertJsonPath('leads.0.id', $leadId);

        $this->actingAs($salesUser, 'web')
            ->patchJson("/my/sales-leads/{$leadId}", [
                'product_id' => $product->id,
                'organization_name' => 'Green Valley Senior School',
                'organization_type' => 'school',
                'contact_person_name' => 'Mary Thomas',
                'interest_level' => 'positive',
                'status' => 'interested',
            ])
            ->assertOk()
            ->assertJsonPath('lead.organization_name', 'Green Valley Senior School')
            ->assertJsonPath('lead.interest_level', 'positive');

        $this->actingAs($salesUser, 'web')
            ->patchJson("/my/sales-leads/{$otherLead->id}", [
                'organization_name' => 'Blocked Edit',
                'organization_type' => 'business',
                'interest_level' => 'negative',
                'status' => 'lost',
            ])
            ->assertNotFound();
    }

    public function test_activity_creation_updates_parent_lead_summary(): void
    {
        $salesUser = $this->userWithRole('sales');
        $lead = SalesLead::factory()->for($salesUser, 'owner')->create([
            'status' => 'new',
            'interest_level' => 'unclear',
        ]);

        $this->actingAs($salesUser, 'web')
            ->postJson("/my/sales-leads/{$lead->id}/activities", [
                'activity_type' => 'call',
                'outcome_status' => 'follow_up',
                'interest_level' => 'positive',
                'response_text' => 'Principal asked for a demo next week.',
                'activity_at' => '2026-06-09 10:30:00',
                'next_follow_up_at' => '2026-06-12 11:00:00',
            ])
            ->assertCreated()
            ->assertJsonPath('lead.status', 'follow_up')
            ->assertJsonPath('lead.interest_level', 'positive')
            ->assertJsonPath('lead.latest_response', 'Principal asked for a demo next week.');

        $this->assertDatabaseHas('sales_lead_activities', [
            'sales_lead_id' => $lead->id,
            'user_id' => $salesUser->id,
            'activity_type' => 'call',
            'outcome_status' => 'follow_up',
        ]);
    }

    public function test_admin_can_archive_sales_lead(): void
    {
        $admin = $this->userWithRole('manager');
        $lead = SalesLead::factory()->create();

        $this->actingAs($admin, 'web')
            ->deleteJson("/admin/sales-leads/{$lead->id}")
            ->assertOk();

        $this->assertSoftDeleted('sales_leads', [
            'id' => $lead->id,
        ]);
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
