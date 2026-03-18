<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientPortalAuthController extends Controller
{
    public function logout(Request $request, Client $client): RedirectResponse
    {
        Auth::guard('organization')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('client.logout.page', $client);
    }
}
