<?php

namespace Tests\Feature;

use App\Http\Controllers\TicketAttachmentController;
use App\Models\Client;
use App\Models\OrganizationUser;
use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TicketAttachmentStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_sets_uploaded_by_as_organization_user_when_authenticated(): void
    {
        Storage::fake('public');

        $client = Client::create([
            'name' => 'A',
            'code' => 'a1',
            'status' => 'active',
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
            'category' => 'general',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $this->actingAs($orgUser, 'organization');

        $file = UploadedFile::fake()->create('a.txt', 1, 'text/plain');

        $attachment = TicketAttachmentController::store($ticket, $file, Request::create('/'));

        $this->assertDatabaseHas('ticket_attachments', [
            'id' => $attachment->id,
            'ticket_id' => $ticket->id,
            'uploaded_by_type' => 'organization_user',
            'uploaded_by' => $orgUser->id,
        ]);

        Storage::disk('public')->assertExists($attachment->file_path);
    }
}