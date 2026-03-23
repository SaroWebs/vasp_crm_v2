<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminClientShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_client_show_includes_code_when_present(): void
    {
        $admin = $this->createAdminUserWithEditPermission();
        $client = Client::create([
            'name' => 'Client A',
            'status' => 'active',
            'code' => 'acme-001',
        ]);

        $this->actingAs($admin, 'web')
            ->get("/admin/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/clients/Show')
                ->where('client.id', $client->id)
                ->where('client.code', 'acme-001')
                ->where('canEdit', true)
            );
    }

    public function test_admin_client_show_includes_null_code_when_missing(): void
    {
        $admin = $this->createAdminUserWithEditPermission();
        $client = Client::create([
            'name' => 'Client B',
            'status' => 'active',
            'code' => null,
        ]);

        $this->actingAs($admin, 'web')
            ->get("/admin/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/clients/Show')
                ->where('client.id', $client->id)
                ->where('client.code', null)
                ->where('canEdit', true)
            );
    }

    public function test_admin_without_client_edit_permission_can_still_edit(): void
    {
        $admin = $this->createAdminUser();
        $client = Client::create([
            'name' => 'Client C',
            'status' => 'active',
        ]);

        $this->actingAs($admin, 'web')
            ->get("/admin/clients/{$client->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/clients/Show')
                ->where('client.id', $client->id)
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

    private function createAdminUserWithEditPermission(): User
    {
        $role = Role::create([
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'web',
            'description' => 'Admin role',
            'is_default' => false,
            'level' => 1,
        ]);

        $permission = Permission::create([
            'name' => 'Edit Client',
            'slug' => 'client.edit',
            'module' => 'client',
            'action' => 'edit',
            'description' => 'Edit client details',
        ]);

        $role->permissions()->attach($permission->id);

        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
