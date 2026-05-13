<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminResetPasswordRequest;
use App\Http\Requests\AdminSendPasswordResetLinkRequest;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminPasswordResetController extends Controller
{
    public function create(Request $request)
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
            'action' => '/admin/forgot-password',
            'loginHref' => '/admin/login',
            'mode' => 'whatsapp',
        ]);
    }

    public function store(AdminSendPasswordResetLinkRequest $request, NotificationService $notificationService): RedirectResponse
    {
        $user = $this->findUserByLogin($request->string('login')->toString());

        if (! $user) {
            return back()->with('status', __('If an account exists, a password reset link has been sent.'));
        }

        $phone = $this->resolveResetPhoneNumber($user);

        if (! $phone) {
            return back()->withErrors([
                'login' => __('No phone number is available for this account.'),
            ]);
        }

        $token = $this->broker()->createToken($user);

        $resetUrl = url("/admin/reset-password/{$token}").'?email='.urlencode($user->email);

        $message = "Password Reset Link\n\nReset your password using this link:\n{$resetUrl}\n\nNote: This link expires in 5 minutes.";

        $notificationService->sendWhatsApp($phone, $message);

        return back()->with('status', __('Password reset link sent on WhatsApp.'));
    }

    public function edit(Request $request, string $token)
    {
        return Inertia::render('auth/reset-password', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
            'action' => '/admin/reset-password',
            'loginHref' => '/admin/login',
        ]);
    }

    public function update(AdminResetPasswordRequest $request, NotificationService $notificationService): RedirectResponse
    {
        $status = $this->broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) use ($notificationService): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $phone = $this->resolveResetPhoneNumber($user);

                if (! $phone) {
                    return;
                }

                $message = "Password Reset Confirmation\n\nYour password has been updated successfully.";

                $notificationService->sendWhatsApp($phone, $message);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return back()->withErrors([
                'email' => __($status),
            ]);
        }

        return redirect('/admin/login')->with('status', __('Your password has been reset.'));
    }

    protected function broker(): PasswordBroker
    {
        return Password::broker('users');
    }

    protected function resolveResetPhoneNumber(User $user): ?string
    {
        $userPhone = $user->phone;

        if (is_string($userPhone) && trim($userPhone) !== '') {
            return $userPhone;
        }

        $employeePhone = $user->employee?->phone;

        if (is_string($employeePhone) && trim($employeePhone) !== '') {
            return $employeePhone;
        }

        return null;
    }

    protected function findUserByLogin(string $login): ?User
    {
        $login = trim($login);

        if ($login === '') {
            return null;
        }

        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            return User::query()
                ->where('email', Str::lower($login))
                ->first();
        }

        $digitsOnly = preg_replace('/\D+/', '', $login);

        $candidates = array_values(array_unique(array_filter([
            $login,
            is_string($digitsOnly) ? $digitsOnly : null,
            is_string($digitsOnly) && strlen($digitsOnly) > 10 ? substr($digitsOnly, -10) : null,
        ], fn (?string $value) => is_string($value) && $value !== '')));

        if ($candidates === []) {
            return null;
        }

        return User::query()
            ->where(function ($query) use ($candidates): void {
                $query->whereIn('phone', $candidates)
                    ->orWhereHas('employee', function ($employeeQuery) use ($candidates): void {
                        $employeeQuery->whereIn('phone', $candidates);
                    });
            })
            ->first();
    }
}
