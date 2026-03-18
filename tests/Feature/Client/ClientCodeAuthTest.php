<?php

namespace Tests\Feature\Client;

use App\Models\Client;
use App\Models\ClientProductInstance;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientCodeAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_login_via_client_code_with_valid_api_key(): void
    {
        config()->set('client-api.api_key', 'test-api-key');
        config()->set('client-api.require_api_key', true);

        $client = Client::factory()->active()->create();
        $product = Product::create([
            'name' => 'Product X1',
            'status' => 'active',
        ]);

        $instance = ClientProductInstance::create([
            'client_id' => $client->id,
            'product_id' => $product->id,
            'code' => 'CLIENT-123',
            'variant_name' => 'Test Variant',
            'deployment_status' => 'active',
        ]);

        $response = $this->withHeader('X-API-KEY', 'test-api-key')
            ->get('/auth/client/'.$instance->code);

        $response->assertRedirect('/client/dashboard');
        $this->assertAuthenticatedAs($client, 'client');
    }

    public function test_client_code_auth_rejects_invalid_api_key(): void
    {
        config()->set('client-api.api_key', 'test-api-key');
        config()->set('client-api.require_api_key', true);

        $client = Client::factory()->active()->create();
        $product = Product::create([
            'name' => 'Product X1',
            'status' => 'active',
        ]);

        $instance = ClientProductInstance::create([
            'client_id' => $client->id,
            'product_id' => $product->id,
            'code' => 'CLIENT-123',
            'variant_name' => 'Test Variant',
            'deployment_status' => 'active',
        ]);

        $response = $this->withHeader('X-API-KEY', 'wrong-key')
            ->get('/auth/client/'.$instance->code);

        $response->assertStatus(401);
        $response->assertJson(['message' => 'Unauthorized. Invalid API_KEY.']);
        $this->assertGuest('client');
    }

    public function test_client_code_auth_returns_404_for_unknown_client_code(): void
    {
        config()->set('client-api.api_key', 'test-api-key');
        config()->set('client-api.require_api_key', true);

        $response = $this->withHeader('X-API-KEY', 'test-api-key')
            ->get('/auth/client/UNKNOWN-CODE');

        $response->assertStatus(404);
        $response->assertJson(['message' => 'No client found for the given client_code.']);
        $this->assertGuest('client');
    }
}
