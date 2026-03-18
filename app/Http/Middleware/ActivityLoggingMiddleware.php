<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLog;

class ActivityLoggingMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only log authenticated requests
        if (!Auth::check()) {
            return $response;
        }

        // Skip logging for certain routes
        $skipRoutes = [
            'api/notifications/*',
            'api/activity-logs/*',
            'api/health',
            'api/telescope/*',
        ];

        foreach ($skipRoutes as $skipRoute) {
            if ($request->is($skipRoute)) {
                return $response;
            }
        }

        // Only log certain HTTP methods
        $logMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!in_array($request->method(), $logMethods)) {
            return $response;
        }

        // Get the route name
        $routeName = $request->route()?->getName() ?? $request->path();
        
        // Get the controller action
        $action = $request->route()?->getActionName() ?? 'unknown';

        // Get request data (excluding sensitive data)
        $requestData = $this->sanitizeRequestData($request->all());

        // Log the activity
        ActivityLog::log(
            "API Request: {$request->method()} {$routeName}",
            null,
            Auth::user(),
            [
                'action' => 'api_request',
                'method' => $request->method(),
                'route' => $routeName,
                'action_name' => $action,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_data' => $requestData,
                'response_status' => $response->status(),
                'response_size' => strlen($response->getContent())
            ],
            'api'
        );

        return $response;
    }

    /**
     * Sanitize request data to remove sensitive information.
     */
    private function sanitizeRequestData(array $data): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'api_token',
            'remember_token',
            'two_factor_code',
            'two_factor_recovery_code'
        ];

        $sanitized = [];

        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), $sensitiveFields)) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = $this->sanitizeRequestData($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}