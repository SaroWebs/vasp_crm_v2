<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrganizationUserController extends Controller
{
    /**
     * Show organization users for a client (Inertia).
     */
    public function index(Request $request, $client_id)
    {
        $client = Client::find($client_id);
        if (! $client) {
            abort(404, 'Client not found');
        }

        $client->load(['organizationUsers' => function ($query) {
            $query->orderBy('name');
        }]);

        $user = User::find(Auth::user()->id);
        $canCreate = $user->hasPermission('client.create') || $user->isSuperAdmin();
        $canEdit = $user->hasPermission('client.edit') || $user->isSuperAdmin();
        $canDelete = $user->hasPermission('client.delete') || $user->isSuperAdmin();
        $canRead = $user->hasPermission('client.read') || $user->isSuperAdmin();

        return Inertia::render('admin/clients/OrganizationUsers', [
            'client' => $client,
            'organizationUsers' => $client->organizationUsers,
            'canCreate' => $canCreate,
            'canEdit' => $canEdit,
            'canDelete' => $canDelete,
            'canRead' => $canRead,
        ]);
    }

    /**
     * Store a new organization user.
     */
    public function store(Request $request, $client_id)
    {
        $client = Client::find($client_id);
        if (! $client) {
            abort(404, 'Client not found');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'designation' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'status' => 'required|in:active,inactive',
        ]);

        OrganizationUser::create([
            'client_id' => $client->id,
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
        ]);

        return redirect("/admin/clients/{$client->id}/organization-users/manage")
            ->with('success', 'Organization user created successfully');
    }

    /**
     * Update an organization user.
     */
    public function update(Request $request, $client_id, $organizationUserId)
    {
        $client = Client::find($client_id);
        if (! $client) {
            abort(404, 'Client not found');
        }

        $organizationUser = OrganizationUser::where('client_id', $client->id)->find($organizationUserId);
        if (! $organizationUser) {
            abort(404, 'Organization user not found');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'designation' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'status' => 'required|in:active,inactive',
        ]);

        $organizationUser->update([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'],
        ]);

        return redirect("/admin/clients/{$client->id}/organization-users/manage")
            ->with('success', 'Organization user updated successfully');
    }

    /**
     * Soft delete an organization user.
     */
    public function destroy(Request $request, $client_id, $organizationUserId)
    {
        $client = Client::find($client_id);
        if (! $client) {
            abort(404, 'Client not found');
        }

        $organizationUser = OrganizationUser::where('client_id', $client->id)->find($organizationUserId);
        if (! $organizationUser) {
            abort(404, 'Organization user not found');
        }

        $organizationUser->delete();

        return redirect("/admin/clients/{$client->id}/organization-users/manage")
            ->with('success', 'Organization user deleted successfully');
    }
}
