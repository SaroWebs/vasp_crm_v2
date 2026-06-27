<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConfigureContentSecurityPolicy
{
    /**
     * @var list<string>
     */
    private const REPORT_ONLY_POLICY = [
        "default-src 'self'",
        "base-uri 'self'",
        "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*",
        "font-src 'self' data:",
        "form-action 'self'",
        "frame-ancestors 'self'",
        "img-src 'self' data: blob:",
        "object-src 'none'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->remove('Content-Security-Policy-Report-Only');
        $response->headers->set('Content-Security-Policy-Report-Only', implode('; ', self::REPORT_ONLY_POLICY));

        return $response;
    }
}
