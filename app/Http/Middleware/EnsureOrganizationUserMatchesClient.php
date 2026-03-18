<?php

namespace App\Http\Middleware;

use App\Models\Client;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrganizationUserMatchesClient
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $organizationUser = Auth::guard('organization')->user();

        $clientParam = $request->route('client');
        $client = $clientParam instanceof Client
            ? $clientParam
            : Client::query()->where('code', (string) $clientParam)->first();

        if (! $client && is_numeric($clientParam)) {
            $client = Client::find((int) $clientParam);
        }

        if (! $organizationUser || ! $client) {
            abort(403);
        }

        if ((int) $organizationUser->client_id !== (int) $client->id) {
            abort(403);
        }

        return $next($request);
    }
}
