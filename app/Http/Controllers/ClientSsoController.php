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
    public function consume(Request $request, string $code, ClientSsoTokenCipher $cipher): RedirectResponse
    {
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

        $token = (string) $request->query('token', '');
        if ($token === '') {
            abort(422, 'Missing token.');
        }

        $payload = $cipher->decryptV1($client, $token);

        $validator = Validator::make($payload, [
            'email' => ['required', 'string', 'email', 'max:255'],
            'iat' => ['required', 'integer'],
            'exp' => ['required', 'integer'],
            'jti' => ['required', 'string', 'max:191'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'designation' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        if ($validator->fails()) {
            abort(422, 'Invalid token payload.');
        }

        $validated = $validator->validated();

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

        $email = mb_strtolower(trim($validated['email']));

        $organizationUser = OrganizationUser::withTrashed()->firstOrNew([
            'client_id' => $client->id,
            'email' => $email,
        ]);

        $organizationUser->name = $validated['name'] ?? $organizationUser->name ?? $email;
        $organizationUser->designation = $validated['designation'] ?? $organizationUser->designation;
        $organizationUser->phone = $validated['phone'] ?? $organizationUser->phone;
        $organizationUser->status = $organizationUser->status ?: 'active';

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
