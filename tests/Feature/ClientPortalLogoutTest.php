<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\OrganizationUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientPortalLogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_logout_redirects_to_logged_out_page(): void
    {
        $client = Client::create([
            'name' => 'Acme',
            'email' => 'client@example.com',
            'phone' => '1234567890',
            'code' => 'acme',
            'address' => 'Somewhere',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $orgUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'person@example.com',
            'name' => 'Person',
            'status' => 'active',
        ]);

        $response = $this->actingAs($orgUser, 'organization')
            ->post("/c/{$client->code}/logout");

        $response->assertRedirect("/c/{$client->code}/logout");
        $this->assertGuest('organization');
    }
}
