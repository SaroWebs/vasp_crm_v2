<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Services\ClientSsoTokenCipher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminClientSsoTestController extends Controller
{
    public function redirectToSso(Request $request, string $clientCode, ClientSsoTokenCipher $cipher): RedirectResponse
    {
        if (app()->isProduction()) {
            abort(404);
        }

        $client = Client::query()
            ->where('code', $clientCode)
            ->first();

        if (!$client && ctype_digit($clientCode)) {
            $client = Client::find((int) $clientCode);
        }

        if (!$client) {
            abort(404, 'Client not found.');
        }

        if (! $client->code) {
            abort(422, 'Client code is required to test SSO.');
        }

        if (! $client->sso_enabled || ! $client->sso_secret) {
            abort(422, 'SSO is not enabled/configured for this client.');
        }

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'designation' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $payload = [
            'email' => $validated['email'],
            'iat' => now()->timestamp,
            'exp' => now()->addMinutes(5)->timestamp,
            'jti' => (string) Str::uuid(),
            'name' => $validated['name'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ];

        $payload = array_filter($payload, fn ($value): bool => $value !== null && $value !== '');

        $token = $cipher->encryptV1($client, $payload);

        return redirect()->route('sso.consume', [
            'code' => $client->code,
            'token' => $token,
        ]);
    }
}
