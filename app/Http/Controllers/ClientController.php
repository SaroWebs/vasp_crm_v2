<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ClientController extends Controller
{
    /**
     * Display all clients (Inertia).
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);
        
        // Build query with relationships
        $query = Client::withTrashed()->with(['organizationUsers', 'tickets', 'product']);
        
        // Apply filters
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        // Get pagination parameters
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        
        // Get paginated results
        $clients = $query->paginate($perPage, ['*'], 'page', $page);
        
        // Transform for frontend
        $clientsData = $clients->getCollection()->map(function ($client) {
            return [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
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

        $canCreate = $user->hasPermission('client.create') || $user->isSuperAdmin();
        $canEdit = $user->hasPermission('client.edit') || $user->isSuperAdmin();
        $canDelete = $user->hasPermission('client.delete') || $user->isSuperAdmin();
        $canRead = $user->hasPermission('client.read') || $user->isSuperAdmin();

        return Inertia::render('admin/clients/Index', [
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
            'userPermissions' => $user->getAllPermissions()->pluck('slug')->toArray(),
            'canCreate' => $canCreate,
            'canEdit' => $canEdit,
            'canDelete' => $canDelete,
            'canRead' => $canRead,
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'nullable|email',
            'phone'    => 'nullable|string|max:20',
            'code'     => 'nullable|string|max:255',
            'address'  => 'nullable|string',
            'status'   => 'required|in:active,inactive',
            'product_id' => 'nullable|exists:products,id',
            'sso_enabled' => ['sometimes', 'boolean'],
            'sso_secret' => [
                Rule::requiredIf(fn (): bool => $request->boolean('sso_enabled')),
                'nullable',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || $value === '') {
                        return;
                    }

                    if (! is_string($value)) {
                        $fail('The SSO secret must be a string.');

                        return;
                    }

                    $decoded = base64_decode($value, true);
                    if ($decoded === false || strlen($decoded) !== 32) {
                        $fail('The SSO secret must be a base64-encoded 32-byte key.');
                    }
                },
            ],
        ]);

        try {
            Client::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'] ?? null,
                'phone'    => $validated['phone'] ?? null,
                'code'     => $validated['code'] ?? null,
                'address'  => $validated['address'] ?? null,
                'status'   => $validated['status'],
                'product_id' => $validated['product_id'] ?? null,
                'sso_enabled' => $request->boolean('sso_enabled'),
                'sso_secret' => $validated['sso_secret'] ?? null,
            ]);

            return redirect('/admin/clients')
                ->with('success', 'Client created successfully');

        } catch (\Exception $e) {
            return back()->withErrors([
                'general' => 'Something went wrong while creating the client: ' . $e->getMessage()
            ])->withInput();
        }
    }

    /**
     * Display specific client (Inertia).
     */
    public function show(Client $client)
    {
        if (!$client) {
            abort(404, 'Client not found');
        }

        // Load comprehensive client data with relationships
        $client->load([
            'organizationUsers',
            'product',
            'tickets' => function($query) {
                $query->latest()->limit(10)->with(['organizationUser']);
            }
        ]);

        // Get user permissions
        $user = User::find(Auth::user()->id);
        $canEdit = $user->hasPermission('client.edit') || $user->isSuperAdmin();
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
        if (!$client) {
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
    public function update(Request $request, $client_id)
    {
        $client = Client::find($client_id);

        if (!$client) {
            abort(404, 'Client not found');
        }

        $ssoEnabled = $request->boolean('sso_enabled');
        $secretRequired = $ssoEnabled && empty($client->sso_secret);

        $validated = $request->validate([
            'name'     => 'required|string',
            'email'    => 'nullable|email',
            'phone'    => 'required|string',
            'code'     => 'nullable|string|max:255',
            'address'  => 'required|string',
            'status'   => 'required|string',
            'product_id' => 'nullable|exists:products,id',
            'sso_enabled' => ['sometimes', 'boolean'],
            'sso_secret' => [
                Rule::requiredIf(fn (): bool => $secretRequired),
                'nullable',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || $value === '') {
                        return;
                    }

                    if (! is_string($value)) {
                        $fail('The SSO secret must be a string.');

                        return;
                    }

                    $decoded = base64_decode($value, true);
                    if ($decoded === false || strlen($decoded) !== 32) {
                        $fail('The SSO secret must be a base64-encoded 32-byte key.');
                    }
                },
            ],
        ]);

        $updatePayload = [
            'name'     => $validated['name'],
            'email'    => $validated['email'] ?? null,
            'phone'    => $validated['phone'],
            'code'     => $validated['code'] ?? null,
            'address'  => $validated['address'],
            'status'   => $validated['status'],
            'product_id' => $validated['product_id'] ?? null,
            'sso_enabled' => $ssoEnabled,
        ];

        if (! empty($validated['sso_secret'])) {
            $updatePayload['sso_secret'] = $validated['sso_secret'];
        }

        $client->update($updatePayload);

        return redirect('/admin/clients/' . $client_id)->with('success', 'Client updated successfully');
    }

    /**
     * Soft delete client.
     */
    public function destroy(Request $request, $client_id)
    {
        $client = Client::find($client_id);
        if (!$client) {
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
        if (!$client) {
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
        if (!$client) {
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
        
        if (!$client) {
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
            'organization_users' => $organizationUsers
        ], 200);
    }
}
