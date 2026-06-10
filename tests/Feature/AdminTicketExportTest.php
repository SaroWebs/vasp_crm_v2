<?php

namespace Tests\Feature;

use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTicketExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateUserSession::class);
    }

    public function test_authorized_admin_can_export_a_consolidated_ticket_report(): void
    {
        $admin = $this->createInternalUser();
        $permission = Permission::create([
            'name' => 'Export Ticket Reports',
            'slug' => 'ticket.export',
            'module' => 'ticket',
            'action' => 'export',
        ]);
        $admin->permissions()->attach($permission, ['granted' => 'granted']);
        $client = Client::factory()->create(['name' => 'Acme School']);

        $openTicket = $this->createTicket($client, $admin, [
            'ticket_number' => 'TKT-OPEN',
            'title' => 'Open final-day ticket',
            'status' => 'open',
            'priority' => 'high',
            'created_at' => Carbon::parse('2026-06-07 23:45:00'),
        ]);
        $closedTicket = $this->createTicket($client, $admin, [
            'ticket_number' => 'TKT-CLOSED',
            'title' => 'Closed ticket',
            'status' => 'closed',
            'priority' => 'low',
            'created_at' => Carbon::parse('2026-06-03 10:00:00'),
        ]);
        $this->createTicket($client, $admin, [
            'ticket_number' => 'TKT-APPROVED',
            'title' => 'Excluded approved ticket',
            'status' => 'approved',
            'created_at' => Carbon::parse('2026-06-04 10:00:00'),
        ]);
        $this->createTicket($client, $admin, [
            'ticket_number' => 'TKT-OLD',
            'title' => 'Excluded old ticket',
            'status' => 'open',
            'created_at' => Carbon::parse('2026-06-01 10:00:00'),
        ]);

        $response = $this->actingAs($admin)->get('/admin/tickets/export?'.http_build_query([
            'start_date' => '2026-06-02',
            'end_date' => '2026-06-07',
            'statuses' => ['open', 'closed'],
            'columns' => ['ticket_number', 'title', 'status'],
        ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $response->assertHeader('content-disposition', 'attachment; filename="consolidated_tickets_2026-06-02_to_2026-06-07.csv"');

        $csv = $response->streamedContent();

        $this->assertStringContainsString('Consolidated Tickets Report', $csv);
        $this->assertStringContainsString('"Total Tickets",2', $csv);
        $this->assertStringContainsString('"Selected Statuses","Open, Closed"', $csv);
        $this->assertStringContainsString('"Ticket Number",Title,Status', $csv);
        $this->assertStringContainsString($openTicket->ticket_number, $csv);
        $this->assertStringContainsString($closedTicket->ticket_number, $csv);
        $this->assertStringNotContainsString('TKT-APPROVED', $csv);
        $this->assertStringNotContainsString('TKT-OLD', $csv);
        $this->assertStringNotContainsString('Client,Priority', $csv);
    }

    public function test_user_without_export_permission_is_forbidden(): void
    {
        $user = $this->createInternalUser();

        $response = $this->actingAs($user)->get('/admin/tickets/export?'.http_build_query([
            'start_date' => '2026-06-02',
            'end_date' => '2026-06-07',
            'statuses' => ['open'],
            'columns' => ['ticket_number'],
        ]));

        $response->assertForbidden();
    }

    public function test_export_requires_statuses_and_columns(): void
    {
        $admin = $this->createInternalUser();
        $permission = Permission::create([
            'name' => 'Export Ticket Reports',
            'slug' => 'ticket.export',
            'module' => 'ticket',
            'action' => 'export',
        ]);
        $admin->permissions()->attach($permission, ['granted' => 'granted']);

        $response = $this->actingAs($admin)
            ->from('/admin/tickets')
            ->get('/admin/tickets/export?'.http_build_query([
                'start_date' => '2026-06-02',
                'end_date' => '2026-06-07',
                'statuses' => [],
                'columns' => [],
            ]));

        $response->assertRedirect('/admin/tickets');
        $response->assertSessionHasErrors(['statuses', 'columns']);
    }

    private function createInternalUser(): User
    {
        $user = User::factory()->create();
        $role = Role::firstOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Manager',
                'guard_name' => 'web',
                'level' => 2,
            ]
        );
        $user->roles()->attach($role);
        $user->load('roles');

        return $user;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createTicket(Client $client, User $creator, array $overrides = []): Ticket
    {
        $attributes = array_merge([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $creator->id,
            'ticket_number' => fake()->unique()->bothify('TKT-####'),
            'title' => fake()->sentence(),
            'description' => fake()->sentence(),
            'category' => 'technical',
            'priority' => 'medium',
            'status' => 'open',
        ], $overrides);
        $createdAt = $attributes['created_at'] ?? null;
        unset($attributes['created_at']);

        $ticket = Ticket::create($attributes);

        if ($createdAt !== null) {
            $ticket->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ])->saveQuietly();
        }

        return $ticket;
    }
}
