<?php

namespace Tests\Feature\Auth;

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GuardSessionIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_logs_out_existing_client_session(): void
    {
        $admin = User::factory()->create();

        $client = Client::create([
            'name' => 'Acme',
            'code' => 'acme-guard-test',
            'status' => 'active',
        ]);

        $organizationUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'org-user@example.com',
            'name' => 'Org User',
            'status' => 'active',
        ]);

        $this->actingAs($organizationUser, 'organization');
        $this->assertAuthenticated('organization');

        $response = $this->post('/admin/login', [
            'email' => $admin->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/admin/dashboard');
        $this->assertAuthenticated('web');
        $this->assertGuest('organization');
    }

    public function test_client_sso_login_logs_out_existing_web_session(): void
    {
        $admin = User::factory()->create();
        $this->actingAs($admin, 'web');
        $this->assertAuthenticated('web');

        $secret = base64_encode(random_bytes(32));
        $client = Client::create([
            'name' => 'XYZ01',
            'code' => 'guard-sso-001',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => $secret,
        ]);

        $payload = [
            'ClientCode' => $client->code,
            'UserEmail' => 'person@example.com',
            'UserName' => 'Person One',
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes(5)->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        $token = $this->makeV1Token($secret, $payload);

        $response = $this->get("/s/{$client->code}?token=".urlencode($token));

        $response->assertRedirect("/c/{$client->code}/tickets");
        $this->assertAuthenticated('organization');
        $this->assertGuest('web');
        $this->assertGuest('admin');
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
