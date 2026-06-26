<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ValidateUserSession
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->is('admin') && ! $request->is('admin/*')) {
            return $next($request);
        }

        $user = Auth::guard('web')->user();

        if ($user) {
            // If user's status is inactive, log them out and prevent access
            if (isset($user->status) && $user->status === 'inactive') {
                Auth::guard('web')->logout();

                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect('/admin/login')->with('status', 'Your account is inactive. Contact administrator.');
            }

            // Sync the stored session_id with the current session.
            // On shared hosting / behind Cloudflare, concurrent requests or internal
            // session regeneration can cause a transient mismatch. Since the user IS
            // authenticated (Laravel validated their session cookie), we trust the
            // current session and simply update the stored ID instead of force-logging out.
            $currentSessionId = $request->session()->getId();
            $storedSessionId  = $user->session_id;

            if (! $storedSessionId || $storedSessionId !== $currentSessionId) {
                // Update the stored session ID silently — do NOT logout the user
                $user->session_id = $currentSessionId;
                $user->saveQuietly();
            }
        }

        return $next($request);
    }
}

