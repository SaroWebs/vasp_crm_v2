<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminClientIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_clients_index_includes_client_code(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();

        $this->actingAs($admin, 'web')
            ->get('/admin/clients')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/clients/Index')
                ->missing('clients')
                ->has('filters')
                ->where('canEdit', true)
            );
    }

    public function test_admin_clients_index_returns_json_payload_for_ajax_requests(): void
    {
        $this->withoutMiddleware(ValidateUserSession::class);
        $admin = $this->createAdminUser();
        $client = Client::create([
            'name' => 'Client B',
            'status' => 'active',
            'code' => 'acme-ajax-001',
        ]);

        $this->actingAs($admin, 'web')
            ->withHeaders([
                'X-Requested-With' => 'XMLHttpRequest',
                'Accept' => 'application/json',
            ])
            ->get('/admin/data/clients')
            ->assertOk()
            ->assertJsonStructure([
                'clients',
                'pagination' => [
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                ],
                'filters',
            ])
            ->assertJsonPath('clients.0.id', $client->id)
            ->assertJsonPath('clients.0.code', 'acme-ajax-001');
    }

    private function createAdminUser(): User
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
