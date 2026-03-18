<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClientSsoTestEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_test_endpoint_redirects_to_sso_consume(): void
    {
        $admin = User::factory()->create();

        $client = Client::create([
            'name' => 'Client A',
            'code' => 'code-a',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $response = $this->actingAs($admin, 'web')->get(
            "/admin/clients/{$client->code}/sso/test?email=person@example.com"
        );

        $response->assertRedirect();

        $location = (string) $response->headers->get('Location');
        $this->assertStringContainsString("/s/{$client->code}", $location);
        $this->assertStringContainsString('token=', $location);
    }
}
