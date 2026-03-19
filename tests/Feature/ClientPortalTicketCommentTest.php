<?php

namespace Tests\Feature;

use App\Events\TicketCommentCreated;
use App\Models\Client;
use App\Models\CommentAttachment;
use App\Models\OrganizationUser;
use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClientPortalTicketCommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_org_user_can_comment_on_own_ticket_and_cannot_post_internal(): void
    {
        Storage::fake('public');

        $client = Client::create([
            'name' => 'A',
            'code' => 'a1',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $orgUser = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'person@example.com',
            'name' => 'Person',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $orgUser->id,
            'ticket_number' => 't-1',
            'title' => 'My Ticket',
            'description' => 'Help',
            'category' => 'general',
            'priority' => 'low',
            'status' => 'open',
        ]);

        Event::fake([TicketCommentCreated::class]);

        $file = UploadedFile::fake()->image('a.png');

        $response = $this->actingAs($orgUser, 'organization')->post(
            "/c/{$client->code}/tickets/{$ticket->id}/comments",
            [
                'comment_text' => 'Hello',
                'is_internal' => true,
                'attachments' => [$file],
            ],
        );

        $response->assertStatus(201);

        Event::assertDispatched(TicketCommentCreated::class);

        $commentId = (int) $response->json('data.id');
        $this->assertGreaterThan(0, $commentId);

        $this->assertDatabaseHas('ticket_comments', [
            'ticket_id' => $ticket->id,
            'commented_by_type' => 'organization_user',
            'commented_by' => $orgUser->id,
            'is_internal' => 0,
        ]);

        $this->assertDatabaseCount('comment_attachments', 1);

        $attachment = CommentAttachment::query()->first();
        $this->assertNotNull($attachment);

        $this->actingAs($orgUser, 'organization')
            ->patch(
                "/c/{$client->code}/tickets/{$ticket->id}/comments/{$commentId}",
                ['comment_text' => 'Updated'],
            )
            ->assertOk()
            ->assertJsonPath('data.comment_text', 'Updated');

        $this->actingAs($orgUser, 'organization')
            ->delete("/c/{$client->code}/tickets/{$ticket->id}/comments/{$commentId}/attachments/{$attachment->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('comment_attachments', ['id' => $attachment->id]);
        Storage::disk('public')->assertMissing($attachment->file_path);

        $this->actingAs($orgUser, 'organization')
            ->delete("/c/{$client->code}/tickets/{$ticket->id}/comments/{$commentId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('ticket_comments', ['id' => $commentId]);

        $this->actingAs($orgUser, 'organization')
            ->get("/c/{$client->code}/tickets/{$ticket->id}/comments")
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_org_user_cannot_comment_on_someone_elses_ticket(): void
    {
        $client = Client::create([
            'name' => 'A',
            'code' => 'a1',
            'status' => 'active',
            'sso_enabled' => true,
            'sso_secret' => base64_encode(random_bytes(32)),
        ]);

        $orgUserA = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'a@example.com',
            'name' => 'A',
            'status' => 'active',
        ]);

        $orgUserB = OrganizationUser::create([
            'client_id' => $client->id,
            'email' => 'b@example.com',
            'name' => 'B',
            'status' => 'active',
        ]);

        $ticket = Ticket::create([
            'client_id' => $client->id,
            'organization_user_id' => $orgUserA->id,
            'ticket_number' => 't-1',
            'title' => 'My Ticket',
            'description' => 'Help',
            'category' => 'general',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $this->actingAs($orgUserB, 'organization')
            ->post(
                "/c/{$client->code}/tickets/{$ticket->id}/comments",
                ['comment_text' => 'Nope'],
            )
            ->assertStatus(404);
    }
}
