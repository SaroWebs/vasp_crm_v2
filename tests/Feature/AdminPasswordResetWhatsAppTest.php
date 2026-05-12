<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Employee;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AdminPasswordResetWhatsAppTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);
    }

    /** @test */
    public function it_sends_a_reset_link_via_whatsapp_using_employee_phone_when_user_phone_is_missing(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'phone' => null,
        ]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'phone' => '9876543210',
        ]);

        $this->mock(NotificationService::class, function ($mock) use ($user) {
            $mock->shouldReceive('sendWhatsApp')
                ->once()
                ->withArgs(function (string $phone, string $message) use ($user): bool {
                    $this->assertSame('9876543210', $phone);
                    $this->assertStringContainsString('/admin/reset-password/', $message);
                    $this->assertStringContainsString(urlencode($user->email), $message);
                    $this->assertStringContainsString('expires in 5 minutes', $message);

                    return true;
                })
                ->andReturn(true);
        });

        $this->post('/admin/forgot-password', [
            'login' => '9876543210',
        ])->assertRedirect();

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);
    }

    /** @test */
    public function it_sends_a_confirmation_message_with_credentials_after_successful_reset(): void
    {
        $user = User::factory()->create([
            'email' => 'admin2@example.com',
            'phone' => '9999999999',
        ]);

        $token = Password::broker('users')->createToken($user);

        $this->mock(NotificationService::class, function ($mock) use ($user) {
            $mock->shouldReceive('sendWhatsApp')
                ->once()
                ->withArgs(function (string $phone, string $message) use ($user): bool {
                    $this->assertSame('9999999999', $phone);
                    $this->assertStringContainsString($user->email, $message);
                    $this->assertStringNotContainsString('NewPass123!', $message);

                    return true;
                })
                ->andReturn(true);
        });

        $this->post('/admin/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NewPass123!',
            'password_confirmation' => 'NewPass123!',
        ])->assertRedirect('/admin/login');

        $user->refresh();

        $this->assertTrue(Hash::check('NewPass123!', $user->password));
    }
}
