<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public static function store(Ticket $ticket, $file, Request $request)
    {
        $path = $file->store('ticket-files', 'public');

        return TicketAttachment::create([
            'ticket_id' => $ticket->id,   // 👉 use ticket model
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'uploaded_by_type' => 'client',
            'uploaded_by' => $request->user()->id ?? 1, // Just example
        ]);
    }



    /**
     * Display the specified resource.
     */
    public function show(TicketAttachment $ticketAttachment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TicketAttachment $ticketAttachment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TicketAttachment $ticketAttachment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public static function destroy(TicketAttachment $attachment)
    {
        if (Storage::exists($attachment->file_path)) {
            Storage::delete($attachment->file_path);
        }

        return $attachment->delete();
    }
}
