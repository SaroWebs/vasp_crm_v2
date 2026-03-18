<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\SsoLoginToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ClientSsoTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_token_logs_in_and_redirects_to_client_tickets(): void
    {
        $secret = base64_encode(random_bytes(32));

        $client = Client::create([
            'name' => 'XYZ01',
            'code' => '234234',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => $secret,
        ]);

        $payload = [
            'email' => 'person@example.com',
            'name' => 'Person One',
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes(5)->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        $token = $this->makeV1Token($secret, $payload);

        $response = $this->get("/s/{$client->code}?token=".urlencode($token));

        $response->assertRedirect("/c/{$client->code}/tickets");
        $this->assertAuthenticated('organization');

        $organizationUser = OrganizationUser::query()
            ->where('client_id', $client->id)
            ->where('email', 'person@example.com')
            ->first();

        $this->assertNotNull($organizationUser);

        $this->assertDatabaseHas('sso_login_tokens', [
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'jti' => $payload['jti'],
        ]);
    }

    public function test_expired_token_is_rejected(): void
    {
        $secret = base64_encode(random_bytes(32));

        $client = Client::create([
            'name' => 'XYZ01',
            'code' => '234234',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => $secret,
        ]);

        $payload = [
            'email' => 'person@example.com',
            'iat' => now()->subMinutes(10)->timestamp,
            'exp' => now()->subMinutes(5)->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        $token = $this->makeV1Token($secret, $payload);

        $this->get("/s/{$client->code}?token=".urlencode($token))
            ->assertStatus(422);

        $this->assertGuest('organization');
    }

    public function test_replay_token_is_rejected(): void
    {
        $secret = base64_encode(random_bytes(32));

        $client = Client::create([
            'name' => 'XYZ01',
            'code' => '234234',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => $secret,
        ]);

        $payload = [
            'email' => 'person@example.com',
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes(5)->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        $token = $this->makeV1Token($secret, $payload);

        $this->get("/s/{$client->code}?token=".urlencode($token))
            ->assertRedirect("/c/{$client->code}/tickets");

        $this->get("/s/{$client->code}?token=".urlencode($token))
            ->assertStatus(403);

        $this->assertSame(1, SsoLoginToken::count());
    }

    public function test_sso_disabled_client_is_rejected(): void
    {
        $secret = base64_encode(random_bytes(32));

        $client = Client::create([
            'name' => 'XYZ01',
            'code' => '234234',
            'status' => 'active',
            'sso_enabled' => false,
            'sso_secret' => $secret,
        ]);

        $payload = [
            'email' => 'person@example.com',
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes(5)->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        $token = $this->makeV1Token($secret, $payload);

        $this->get("/s/{$client->code}?token=".urlencode($token))
            ->assertStatus(403);

        $this->assertGuest('organization');
    }

    public function test_existing_organization_user_is_updated_from_payload(): void
    {
        $secret = base64_encode(random_bytes(32));

        $client = Client::create([
            'name' => 'XYZ01',
            'code' => '234234',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => $secret,
        ]);

        $existing = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'person@example.com',
            'name' => 'Old Name',
            'status' => 'active',
        ]);

        $payload = [
            'email' => 'person@example.com',
            'name' => 'New Name',
            'phone' => '9999999999',
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes(5)->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        $token = $this->makeV1Token($secret, $payload);

        $this->get("/s/{$client->code}?token=".urlencode($token))
            ->assertRedirect("/c/{$client->code}/tickets");

        $existing->refresh();

        $this->assertSame('New Name', $existing->name);
        $this->assertSame('9999999999', $existing->phone);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function makeV1Token(string $base64Key, array $payload): string
    {
        $key = base64_decode($base64Key, true);
        $this->assertIsString($key);
        $this->assertSame(32, strlen($key));

        $iv = random_bytes(12);
        $plaintext = json_encode($payload, JSON_THROW_ON_ERROR);

        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        $this->assertIsString($ciphertext);
        $this->assertNotSame('', $tag);

        return 'v1.'
            .$this->base64UrlEncode($iv).'.'
            .$this->base64UrlEncode($ciphertext).'.'
            .$this->base64UrlEncode($tag);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
