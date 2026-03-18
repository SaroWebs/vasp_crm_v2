<?php

namespace Tests\Feature\Client;

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ClientAuthenticationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /** @test */
    public function client_can_view_login_page()
    {
        $response = $this->get('/client/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('client/login'));
    }

    /** @test */
    public function client_can_login_with_valid_credentials()
    {
        $client = Client::factory()->create([
            'email' => 'client@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $response = $this->post('/client/login', [
            'email' => 'client@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Login successful',
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
            ],
        ]);
        $this->assertAuthenticatedAs($client, 'client');
    }

    /** @test */
    public function client_cannot_login_with_invalid_credentials()
    {
        $client = Client::factory()->create([
            'email' => 'client@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $response = $this->post('/client/login', [
            'email' => 'client@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'The provided credentials do not match our records.',
        ]);
        $this->assertGuest('client');
    }

    /** @test */
    public function client_cannot_login_if_inactive()
    {
        $client = Client::factory()->create([
            'email' => 'client@example.com',
            'password' => bcrypt('password123'),
            'status' => 'inactive',
        ]);

        $response = $this->post('/client/login', [
            'email' => 'client@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'The provided credentials do not match our records.',
        ]);
        $this->assertGuest('client');
    }

    /** @test */
    public function client_can_logout()
    {
        $client = Client::factory()->create([
            'email' => 'client@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $this->actingAs($client, 'client');

        $response = $this->post('/logout');

        $response->assertRedirect('/client/login');
        $this->assertGuest('client');
    }

    /** @test */
    public function client_can_view_dashboard_when_authenticated()
    {
        $client = Client::factory()->create([
            'email' => 'client@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $response = $this->actingAs($client, 'client')->get('/client/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('client/dashboard')
            ->where('auth.user.name', $client->name)
            ->where('auth.user.email', $client->email)
        );
    }

    /** @test */
    public function client_cannot_view_dashboard_when_not_authenticated()
    {
        $response = $this->get('/client/dashboard');

        $response->assertRedirect('/client/login');
    }
}
