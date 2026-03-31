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
        $user = Auth::user();

        if ($user) {
            $currentSessionId = $request->session()->getId();
            $storedSessionId = $user->session_id;

            // If stored session ID doesn't match current session, log the user out
            if (!$storedSessionId || $storedSessionId !== $currentSessionId) {
                Auth::guard('web')->logout();

                $request->session()->invalidate();
                $request->session()->regenerateToken();

                // Redirect to login with a message
                return redirect('/admin/login')->with('status', 'Your session has been invalidated. Please login again.');
            }
        }

        return $next($request);
    }
}
