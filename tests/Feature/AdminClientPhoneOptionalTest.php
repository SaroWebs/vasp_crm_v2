<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClientPhoneOptionalTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_client_without_phone_number(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin, 'web')->post('/admin/clients', [
            'name' => 'Client Phone Optional',
            'email' => 'optional@example.com',
            'phone' => '',
            'status' => 'active',
        ]);

        $response->assertRedirect('/admin/clients');

        $client = Client::query()->where('name', 'Client Phone Optional')->first();
        $this->assertNotNull($client);
        $this->assertNull($client->phone);
    }

    public function test_admin_can_update_client_without_phone_number(): void
    {
        $admin = $this->createAdminUser();
        $client = Client::create([
            'name' => 'Client Needs Phone',
            'status' => 'active',
            'phone' => '123',
            'address' => 'Address',
        ]);

        $response = $this->actingAs($admin, 'web')->patch("/admin/clients/{$client->id}", [
            'name' => $client->name,
            'email' => $client->email,
            'phone' => '',
            'code' => $client->code,
            'address' => $client->address,
            'status' => $client->status,
            'sso_enabled' => false,
        ]);

        $response->assertRedirect("/admin/clients/{$client->id}");

        $client->refresh();
        $this->assertNull($client->phone);
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
