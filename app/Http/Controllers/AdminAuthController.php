<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function showLoginForm()
    {
        // Redirect if already authenticated as admin
        if (Auth::guard('web')->check()) {
            return redirect('/admin/dashboard');
        }

        return inertia('auth/login', [
            'isAdmin' => true,
            'canResetPassword' => false,
            'status' => session('status'),
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $credentials = $request->only('email', 'password');

        $user = \App\Models\User::where('email', $credentials['email'])->first();

        if ($user && $user->session_id && $user->session_id !== $request->session()->getId()) {
            // User has an active session on a different device - invalidate it
            // The previous session will be logged out automatically when it tries to access protected routes
        }

        if (Auth::guard('web')->attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            // Store the session ID in the user record
            $user = Auth::user();
            $user->setCurrentSessionId($request->session()->getId());

            return redirect('/admin/dashboard');
        }

        throw ValidationException::withMessages([
            'email' => __('auth.failed'),
        ]);
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            $user->clearSessionId();
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/login');
    }
}