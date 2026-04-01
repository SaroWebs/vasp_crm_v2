<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientController extends Controller
{
    /**
     * Display all clients (Inertia).
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);

        $canCreate = $user->hasPermission('client.create') || $user->isSuperAdmin();
        $canEdit = true;
        $canDelete = $user->hasPermission('client.delete') || $user->isSuperAdmin();
        $canRead = $user->hasPermission('client.read') || $user->isSuperAdmin();

        return Inertia::render('admin/clients/Index', [
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
            'userPermissions' => $user->getAllPermissions()->pluck('slug')->toArray(),
            'canCreate' => $canCreate,
            'canEdit' => $canEdit,
            'canDelete' => $canDelete,
            'canRead' => $canRead,
        ]);
    }

    /**
     * Return paginated clients data for on-demand loading.
     */
    public function getData(Request $request)
    {
        $query = Client::withTrashed()->with(['organizationUsers', 'tickets', 'product']);

        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        $clients = $query->paginate($perPage, ['*'], 'page', $page);

        $clientsData = $clients->getCollection()->map(function ($client) {
            return [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'code' => $client->code,
                'address' => $client->address,
                'status' => $client->status,
                'deleted_at' => $client->deleted_at,
                'created_at' => $client->created_at,
                'updated_at' => $client->updated_at,
                'product' => $client->product ? [
                    'id' => $client->product->id,
                    'name' => $client->product->name,
                ] : null,
                'organization_users' => $client->organizationUsers->map(function ($orgUser) {
                    return [
                        'id' => $orgUser->id,
                        'name' => $orgUser->name,
                        'email' => $orgUser->email,
                        'designation' => $orgUser->designation,
                        'phone' => $orgUser->phone,
                        'status' => $orgUser->status,
                    ];
                }),
                'tickets' => $client->tickets->map(function ($ticket) {
                    return [
                        'id' => $ticket->id,
                        'ticket_number' => $ticket->ticket_number,
                        'title' => $ticket->title,
                        'status' => $ticket->status,
                        'priority' => $ticket->priority,
                        'created_at' => $ticket->created_at,
                    ];
                }),
            ];
        });

        return response()->json([
            'clients' => $clientsData,
            'pagination' => [
                'current_page' => $clients->currentPage(),
                'per_page' => $clients->perPage(),
                'total' => $clients->total(),
                'last_page' => $clients->lastPage(),
            ],
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    /**
     * Show create form (Inertia).
     */
    public function create()
    {
        return Inertia::render('admin/clients/Create', [
            'products' => Product::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store new client.
     */
    public function store(StoreClientRequest $request)
    {
        $validated = $request->validated();

        try {
            Client::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'code' => $validated['code'] ?? null,
                'address' => $validated['address'] ?? null,
                'status' => $validated['status'],
                'product_id' => $validated['product_id'] ? (int) $validated['product_id'] : null,
                'sso_enabled' => $request->boolean('sso_enabled'),
                'sso_secret' => $validated['sso_secret'] ?? null,
            ]);

            return redirect('/admin/clients')
                ->with('success', 'Client created successfully');

        } catch (\Exception $e) {
            return back()->withErrors([
                'general' => 'Something went wrong while creating the client: '.$e->getMessage(),
            ])->withInput();
        }
    }

    /**
     * Display specific client (Inertia).
     */
    public function show(Client $client)
    {
        if (! $client) {
            abort(404, 'Client not found');
        }

        // Load comprehensive client data with relationships
        $client->load([
            'organizationUsers',
            'product',
            'tickets' => function ($query) {
                $query->latest()->limit(10)->with(['organizationUser']);
            },
        ]);

        // Get user permissions
        $user = User::find(Auth::user()->id);
        $canEdit = true;
        $canDelete = $user->hasPermission('client.delete') || $user->isSuperAdmin();
        $canRead = $user->hasPermission('client.read') || $user->isSuperAdmin();

        // Calculate client statistics
        $stats = [
            'total_organization_users' => $client->organizationUsers->count(),
            'active_organization_users' => $client->organizationUsers->where('status', 'active')->count(),
            'total_tickets' => $client->tickets->count(),
            'open_tickets' => $client->tickets->where('status', 'open')->count(),
            'approved_tickets' => $client->tickets->where('status', 'approved')->count(),
            'completed_tickets' => $client->tickets->where('status', 'closed')->count(),
        ];

        return Inertia::render('admin/clients/Show', [
            'client' => $client,
            'stats' => $stats,
            'canEdit' => $canEdit,
            'canDelete' => $canDelete,
            'canRead' => $canRead,
        ]);
    }

    /**
     * Show edit form (Inertia).
     */
    public function edit(Request $request, $client_id)
    {
        $client = Client::find($client_id);
        if (! $client) {
            abort(404, 'Client not found');
        }

        return Inertia::render('admin/clients/Edit', [
            'client' => [
                ...$client->only([
                    'id',
                    'name',
                    'email',
                    'phone',
                    'code',
                    'address',
                    'status',
                    'product_id',
                    'created_at',
                    'updated_at',
                ]),
                'sso_enabled' => (bool) $client->sso_enabled,
                'has_sso_secret' => ! empty($client->sso_secret),
            ],
            'products' => Product::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update client.
     */
    public function update(UpdateClientRequest $request, $client_id)
    {
        $client = Client::find($client_id);

        if (! $client) {
            abort(404, 'Client not found');
        }

        $ssoEnabled = $request->boolean('sso_enabled');

        $validated = $request->validated();

        $updatePayload = [
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'code' => $validated['code'] ?? null,
            'address' => $validated['address'],
            'status' => $validated['status'],
            'product_id' => $validated['product_id'] ?? null,
            'sso_enabled' => $ssoEnabled,
        ];

        if (! empty($validated['sso_secret'])) {
            $updatePayload['sso_secret'] = $validated['sso_secret'];
        }

        $client->update($updatePayload);

        return redirect('/admin/clients/'.$client_id)->with('success', 'Client updated successfully');
    }

    /**
     * Soft delete client.
     */
    public function destroy(Request $request, $client_id)
    {
        $client = Client::find($client_id);
        if (! $client) {
            abort(404, 'Client not found');
        }
        $client->delete();

        if ($request->ajax() || $request->expectsJson()) {
            return response()->json([
                'message' => 'Client deleted successfully',
            ]);
        }

        return redirect('/admin/clients')->with('success', 'Client deleted successfully');
    }

    /**
     * Restore soft-deleted client.
     */
    public function restore(Request $request, $client_id)
    {
        $client = Client::onlyTrashed()->find($client_id);
        if (! $client) {
            abort(404, 'Client not found');
        }
        $client->restore();

        if ($request->ajax() || $request->expectsJson()) {
            return response()->json([
                'message' => 'Client restored successfully',
            ]);
        }

        return redirect('/admin/clients')->with('success', 'Client restored successfully');
    }

    /**
     * Permanently delete soft-deleted client.
     */
    public function forceDelete(Request $request, $client_id)
    {
        $client = Client::onlyTrashed()->find($client_id);
        if (! $client) {
            abort(404, 'Archived client not found');
        }

        $client->forceDelete();

        if ($request->ajax() || $request->expectsJson()) {
            return response()->json([
                'message' => 'Client permanently deleted',
            ]);
        }

        return redirect('/admin/clients')->with('success', 'Client permanently deleted');
    }

    /**
     * Get organization users for a specific client.
     */
    public function getClientOrganizationUsers(Request $request, $client_id)
    {
        $client = Client::with('organizationUsers')->find($client_id);

        if (! $client) {
            return response()->json(['message' => 'Client not found'], 404);
        }

        $organizationUsers = $client->organizationUsers->map(function ($orgUser) {
            return [
                'id' => $orgUser->id,
                'name' => $orgUser->name,
                'email' => $orgUser->email,
                'designation' => $orgUser->designation,
                'phone' => $orgUser->phone,
                'status' => $orgUser->status,
            ];
        });

        return response()->json([
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
            ],
            'organization_users' => $organizationUsers,
        ], 200);
    }
}
