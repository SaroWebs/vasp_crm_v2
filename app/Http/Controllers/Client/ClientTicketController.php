<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientTicketRequest;
use App\Http\Requests\UpdateClientTicketRequest;
use App\Models\Client;
use App\Models\Ticket;
use App\Services\TicketNumberGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ClientTicketController extends Controller
{
    public function index(Request $request, Client $client): Response
    {
        $organizationUser = Auth::guard('organization')->user();

        $query = Ticket::query()
            ->where('client_id', $client->id)
            ->where('organization_user_id', $organizationUser->id)
            ->latest();

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('ticket_number', 'like', '%'.$search.'%');
            });
        }

        $tickets = $query->paginate(10)->withQueryString();

        return Inertia::render('client/tickets/Index', [
            'client' => $client->only(['id', 'name', 'code']),
            'tickets' => $tickets,
            'filters' => [
                'search' => $request->query('search'),
            ],
        ]);
    }

    public function create(Client $client): Response
    {
        return Inertia::render('client/tickets/Create', [
            'client' => $client->only(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreClientTicketRequest $request, Client $client, TicketNumberGenerator $ticketNumberGenerator): RedirectResponse
    {
        $organizationUser = Auth::guard('organization')->user();

        $validated = $request->validated();

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $organizationUser->id,
            'ticket_number' => $ticketNumberGenerator->generateForClient($client),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'status' => 'open',
        ]);

        return redirect()->route('client.tickets.show', [$client, $ticket])
            ->with('success', 'Ticket created successfully.');
    }

    public function show(Client $client, Ticket $ticket): Response
    {
        $this->ensureCanAccessTicket($client, $ticket);

        return Inertia::render('client/tickets/Show', [
            'client' => $client->only(['id', 'name', 'code']),
            'ticket' => $ticket->only([
                'id',
                'ticket_number',
                'title',
                'description',
                'category',
                'priority',
                'status',
                'assigned_to',
                'created_at',
                'updated_at',
            ]),
        ]);
    }

    public function edit(Client $client, Ticket $ticket): Response
    {
        $this->ensureCanAccessTicket($client, $ticket);
        $this->ensureTicketIsEditable($ticket);

        return Inertia::render('client/tickets/Edit', [
            'client' => $client->only(['id', 'name', 'code']),
            'ticket' => $ticket->only([
                'id',
                'ticket_number',
                'title',
                'description',
                'category',
                'priority',
                'status',
                'assigned_to',
                'created_at',
                'updated_at',
            ]),
        ]);
    }

    public function update(UpdateClientTicketRequest $request, Client $client, Ticket $ticket): RedirectResponse
    {
        $this->ensureCanAccessTicket($client, $ticket);
        $this->ensureTicketIsEditable($ticket);

        $ticket->update($request->validated());

        return redirect()->route('client.tickets.show', [$client, $ticket])
            ->with('success', 'Ticket updated successfully.');
    }

    public function destroy(Request $request, Client $client, Ticket $ticket): RedirectResponse
    {
        $this->ensureCanAccessTicket($client, $ticket);
        $this->ensureTicketIsEditable($ticket);

        $ticket->delete();

        return redirect()->route('client.tickets.index', $client)
            ->with('success', 'Ticket deleted successfully.');
    }

    private function ensureCanAccessTicket(Client $client, Ticket $ticket): void
    {
        $organizationUser = Auth::guard('organization')->user();

        if ((int) $ticket->client_id !== (int) $client->id) {
            abort(404);
        }

        if ((int) $ticket->organization_user_id !== (int) $organizationUser->id) {
            abort(404);
        }
    }

    private function ensureTicketIsEditable(Ticket $ticket): void
    {
        if ($ticket->status !== 'open') {
            abort(403, 'Ticket can only be modified while it is open.');
        }

        if ($ticket->assigned_to !== null) {
            abort(403, 'Ticket can only be modified before it is assigned.');
        }
    }
}
