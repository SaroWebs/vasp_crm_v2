<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, $permission)
    {
        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        /** @var \App\Models\User $user */
        $user = Auth::guard('web')->user();

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'message' => 'Insufficient permissions',
                'required_permission' => $permission,
                'user_permissions' => $user->getAllPermissions()->pluck('slug')
            ], 403);
        }

        return $next($request);
    }
}