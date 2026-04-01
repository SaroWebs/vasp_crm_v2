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
            $currentSessionId = $request->session()->getId();
            $storedSessionId = $user->session_id;

            if (! $storedSessionId || $storedSessionId !== $currentSessionId) {
                Auth::guard('web')->logout();

                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect('/admin/login')->with('status', 'Your session has been invalidated. Please login again.');
            }
        }

        return $next($request);
    }
}
