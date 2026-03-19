<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\SsoLoginToken;
use App\Services\ClientSsoTokenCipher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ClientSsoController extends Controller
{
    /**
     * SSO consume endpoint.
     * URL: /s/{CLIENT_CODE}?token={SSO_TOKEN}
     */
    public function consume(Request $request, string $code, ClientSsoTokenCipher $cipher): RedirectResponse
    {
        $token = (string) $request->query('token', '');
        if ($token === '') {
            abort(422, 'Missing token.');
        }

        $client = Client::query()
            ->where('code', $code)
            ->first();

        if (!$client) {
            abort(404, 'Client not found.');
        }

        if (!$client->sso_enabled) {
            abort(403, 'SSO is disabled for this client.');
        }

        if (!$client->sso_secret) {
            abort(403, 'SSO secret is not configured for this client.');
        }

        $payload = $cipher->decryptV1($client, $token);

        $validator = Validator::make($payload, [
            // Client info (for validation/updates)
            'ClientCode' => ['required', 'string', 'max:255'],
            'ClientName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ClientEmail' => ['sometimes', 'nullable', 'string', 'email', 'max:255'],
            'ClientPhone' => ['sometimes', 'nullable', 'string', 'max:50'],
            // User info
            'UserLogin' => ['sometimes', 'nullable', 'string', 'max:255'],
            'UserName' => ['required', 'string', 'max:255'],
            'UserPhone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'UserEmail' => ['required', 'string', 'email', 'max:255'],
            // Standard JWT claims
            'iat' => ['required', 'integer'],
            'exp' => ['required', 'integer'],
            'jti' => ['required', 'string', 'max:191'],
        ]);

        if ($validator->fails()) {
            abort(422, 'Invalid token payload.');
        }

        $validated = $validator->validated();

        // Validate client code matches
        if ($validated['ClientCode'] !== $code) {
            abort(422, 'Client code mismatch.');
        }

        $now = now()->timestamp;
        $clockSkew = 60;

        if ($validated['iat'] > $now + $clockSkew) {
            abort(422, 'Token not valid yet.');
        }

        if ($validated['exp'] < $now - $clockSkew) {
            abort(422, 'Token has expired.');
        }

        $jti = $validated['jti'];
        $alreadyUsed = SsoLoginToken::query()
            ->where('client_id', $client->id)
            ->where('jti', $jti)
            ->exists();

        if ($alreadyUsed) {
            abort(403, 'This link has already been used.');
        }

        $email = mb_strtolower(trim($validated['UserEmail']));

        $organizationUser = OrganizationUser::withTrashed()->firstOrNew([
            'client_id' => $client->id,
            'email' => $email,
        ]);

        $organizationUser->name = $validated['UserName'] ?? $organizationUser->name ?? $email;
        $organizationUser->phone = $validated['UserPhone'] ?? $organizationUser->phone;
        $organizationUser->status = $organizationUser->status ?: 'active';

        // Optionally update client info if provided
        if (isset($validated['ClientName']) || isset($validated['ClientEmail']) || isset($validated['ClientPhone'])) {
            $client->name = $validated['ClientName'] ?? $client->name;
            $client->email = $validated['ClientEmail'] ?? $client->email;
            $client->phone = $validated['ClientPhone'] ?? $client->phone;
            $client->save();
        }

        if ($organizationUser->trashed()) {
            $organizationUser->restore();
        }

        $organizationUser->save();

        if ($organizationUser->status !== 'active') {
            abort(403, 'This user is inactive.');
        }

        SsoLoginToken::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'jti' => $jti,
            'expires_at' => now()->setTimestamp((int) $validated['exp']),
            'used_at' => now(),
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        Auth::guard('organization')->login($organizationUser);
        $request->session()->regenerate();

        return redirect()->route('client.tickets.index', $client);
    }
}
