<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClientSsoFieldsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_client_with_sso_enabled_and_secret(): void
    {
        $admin = User::factory()->create();

        $secret = base64_encode(random_bytes(32));

        $response = $this->actingAs($admin, 'web')->post('/admin/clients', [
            'name' => 'Client A',
            'email' => 'a@example.com',
            'phone' => '123',
            'code' => 'code-a',
            'address' => 'Addr',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => $secret,
        ]);

        $response->assertRedirect('/admin/clients');

        $client = Client::query()->where('code', 'code-a')->first();
        $this->assertNotNull($client);
        $this->assertTrue($client->sso_enabled);
        $this->assertSame($secret, $client->sso_secret);
    }

    public function test_admin_create_rejects_invalid_sso_secret(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin, 'web')
            ->post('/admin/clients', [
                'name' => 'Client A',
                'status' => 'active',
                'sso_enabled' => true,
                'sso_secret' => 'not-base64',
            ])
            ->assertSessionHasErrors(['sso_secret']);
    }

    public function test_admin_update_requires_secret_when_enabling_without_existing_secret(): void
    {
        $admin = User::factory()->create();

        $client = Client::create([
            'name' => 'Client A',
            'code' => 'code-a',
            'status' => 'active',
            'sso_enabled' => false,
            'sso_secret' => null,
            'phone' => '123',
            'address' => 'Addr',
        ]);

        $this->actingAs($admin, 'web')
            ->patch("/admin/clients/{$client->id}", [
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'code' => $client->code,
                'address' => $client->address,
                'status' => $client->status,
                'sso_enabled' => true,
                'sso_secret' => '',
            ])
            ->assertSessionHasErrors(['sso_secret']);
    }

    public function test_admin_update_keeps_existing_secret_when_blank(): void
    {
        $admin = User::factory()->create();

        $secret = base64_encode(random_bytes(32));

        $client = Client::create([
            'name' => 'Client A',
            'code' => 'code-a',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => $secret,
            'phone' => '123',
            'address' => 'Addr',
        ]);

        $this->actingAs($admin, 'web')
            ->patch("/admin/clients/{$client->id}", [
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'code' => $client->code,
                'address' => $client->address,
                'status' => $client->status,
                'sso_enabled' => true,
                'sso_secret' => '',
            ])
            ->assertRedirect("/admin/clients/{$client->id}");

        $client->refresh();

        $this->assertTrue($client->sso_enabled);
        $this->assertSame($secret, $client->sso_secret);
    }
}