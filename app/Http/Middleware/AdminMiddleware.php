<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Ensures that:
     * 1. User is authenticated via the web guard (admin guard)
     * 2. User has internal role (super-admin, admin, manager, team-lead, developer, support-agent)
     * 3. Organization users (client users) are rejected
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if user is authenticated via web guard (admin users)
        if (!Auth::guard('web')->check()) {
            return redirect('/admin/login')->with('error', 'Please login to access admin area.');
        }

        $user = Auth::guard('web')->user();

        // Reject if user is an OrganizationUser (client user)
        // OrganizationUsers use the 'organization' guard, not 'web' guard
        // But as an extra safeguard, check if user is actually a User model
        if (!$user instanceof \App\Models\User) {
            Auth::guard('web')->logout();
            return redirect('/admin/login')->with('error', 'Access denied. Admin area is for internal users only.');
        }

        // Check if user has internal role (allow all internal roles)
        $internalRoles = ['super-admin', 'admin', 'manager', 'team-lead', 'developer', 'support-agent','hr','sales'];
        if (!$user->hasRole($internalRoles)) {
            return redirect('/')->with('error', 'You do not have permission to access the admin area.');
        }

        return $next($request);
    }
}