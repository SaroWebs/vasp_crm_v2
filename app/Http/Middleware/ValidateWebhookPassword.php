<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateWebhookPassword
{
    public function handle(Request $request, Closure $next, string $endpoint): Response
    {
        $headerPassword = $request->header('X-Webhook-Password');
        $configKey = "webhooks.passwords.{$endpoint}";
        if (! config()->has($configKey)) {
            return response()->json([
                'error' => 'Server Error',
                'message' => "Webhook password is not configured for endpoint [{$endpoint}]. Missing config key [{$configKey}].",
            ], 500);
        }

        $expectedPassword = config($configKey);

        // Convert both to strings for comparison (support integer or string passwords)
        $headerPasswordStr = (string) $headerPassword;
        $expectedPasswordStr = (string) $expectedPassword;

        if (! $headerPassword || $headerPasswordStr !== $expectedPasswordStr) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid or missing webhook password',
            ], 401);
        }

        return $next($request);
    }
}
