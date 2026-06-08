<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Product;
use App\Models\Role;
use App\Models\SalesLead;
use App\Models\SalesLeadActivity;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SalesLeadScaffoldTest extends TestCase
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

    public function test_sales_lead_tables_are_created_with_phase_two_columns(): void
    {
        $this->assertTrue(Schema::hasColumns('sales_leads', [
            'owner_user_id',
            'product_id',
            'organization_name',
            'organization_type',
            'contact_person_name',
            'contact_phone',
            'contact_email',
            'interest_level',
            'status',
            'latest_response',
            'last_contacted_at',
            'next_follow_up_at',
            'deleted_at',
        ]));

        $this->assertTrue(Schema::hasColumns('sales_lead_activities', [
            'sales_lead_id',
            'user_id',
            'activity_type',
            'outcome_status',
            'response_text',
            'activity_at',
            'next_follow_up_at',
        ]));
    }

    public function test_sales_lead_relationships_are_available(): void
    {
        $owner = User::factory()->create(['status' => 'active']);
        $product = Product::create([
            'name' => 'School ERP',
            'status' => 'active',
        ]);

        $lead = SalesLead::factory()
            ->for($owner, 'owner')
            ->state([
                'product_id' => $product->id,
                'organization_name' => 'Green Valley School',
                'organization_type' => 'school',
                'interest_level' => 'positive',
                'status' => 'new',
            ])
            ->create();

        $activity = SalesLeadActivity::factory()
            ->for($lead)
            ->for($owner)
            ->state([
                'activity_type' => 'call',
                'outcome_status' => 'contacted',
                'response_text' => 'Requested a follow-up meeting.',
            ])
            ->create();

        $this->assertTrue($owner->salesLeads->contains($lead));
        $this->assertTrue($product->salesLeads->contains($lead));
        $this->assertTrue($lead->activities->contains($activity));
        $this->assertSame($owner->id, $activity->user->id);
    }

    public function test_admin_sales_leads_route_renders_placeholder_page(): void
    {
        $user = $this->actingAsInternalUser('sales');

        $this->actingAs($user, 'web')
            ->get('/admin/sales-leads')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/sales-leads/Index'));
    }

    public function test_my_sales_leads_route_renders_placeholder_page(): void
    {
        $user = $this->actingAsInternalUser('sales');

        $this->actingAs($user, 'web')
            ->get('/my/sales-leads')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('my/sales-leads/Index'));
    }

    private function actingAsInternalUser(string $roleSlug): User
    {
        $role = Role::create([
            'name' => str($roleSlug)->headline()->toString(),
            'slug' => $roleSlug,
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create(['status' => 'active']);
        $user->assignRole($role);

        return $user;
    }
}
