<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ValidateUserSession;
use App\Models\Client;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminTicketsStatsTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_correct_ticket_stats_on_admin_index(): void
    {
        $admin = User::factory()->create();
        $client = Client::factory()->active()->create();

        $openTicket = Ticket::query()->create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $admin->id,
            'ticket_number' => 'T-'.Str::upper(Str::random(10)),
            'title' => 'Open ticket',
            'status' => 'open',
        ]);

        $openTicket->timestamps = false;
        $openTicket->forceFill([
            'created_at' => Carbon::yesterday(),
            'updated_at' => Carbon::yesterday(),
        ])->saveQuietly();

        $inProgressTicket = Ticket::query()->create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $admin->id,
            'ticket_number' => 'T-'.Str::upper(Str::random(10)),
            'title' => 'In progress ticket',
            'status' => 'in-progress',
        ]);

        $inProgressTicket->timestamps = false;
        $inProgressTicket->forceFill([
            'created_at' => Carbon::today(),
            'updated_at' => Carbon::today(),
        ])->saveQuietly();

        $closedTicket1 = Ticket::query()->create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $admin->id,
            'ticket_number' => 'T-'.Str::upper(Str::random(10)),
            'title' => 'Closed ticket 1',
            'status' => 'closed',
        ]);

        $closedTicket1->timestamps = false;
        $closedTicket1->forceFill([
            'created_at' => Carbon::yesterday(),
            'updated_at' => Carbon::yesterday(),
        ])->saveQuietly();

        $closedTicket2 = Ticket::query()->create([
            'client_id' => $client->id,
            'organization_user_id' => null,
            'created_by' => $admin->id,
            'ticket_number' => 'T-'.Str::upper(Str::random(10)),
            'title' => 'Closed ticket 2',
            'status' => 'closed',
        ]);

        $closedTicket2->timestamps = false;
        $closedTicket2->forceFill([
            'created_at' => Carbon::yesterday(),
            'updated_at' => Carbon::yesterday(),
        ])->saveQuietly();

        $this->withoutMiddleware([
            ValidateUserSession::class,
            AdminMiddleware::class,
        ]);

        $response = $this->actingAs($admin, 'web')->get('/admin/tickets');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/tickets/Index')
            ->where('stats.total_open', 1)
            ->where('stats.open_today', 0)
            ->where('stats.in_progress', 1)
            ->where('stats.completed', 2)
        );
    }
}
