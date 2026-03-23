<?php

namespace Tests\Feature;

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
        $admin = $this->createAdminUser();
        $client = Client::create([
            'name' => 'Client A',
            'status' => 'active',
            'code' => 'acme-001',
        ]);

        $this->actingAs($admin, 'web')
            ->get('/admin/clients')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/clients/Index')
                ->has('clients', 1)
                ->where('clients.0.id', $client->id)
                ->where('clients.0.code', 'acme-001')
                ->where('canEdit', true)
            );
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
