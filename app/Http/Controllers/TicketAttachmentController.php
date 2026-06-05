<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public static function store(Ticket $ticket, $file, Request $request): TicketAttachment
    {
        $path = $file->store('ticket-files/'.$ticket->id, 'public');

        $uploadedByType = 'user';
        $uploadedBy = null;

        if (Auth::guard('organization')->check()) {
            $uploadedByType = 'organization_user';
            $uploadedBy = Auth::guard('organization')->id();
        } elseif (Auth::guard('web')->check()) {
            $uploadedByType = 'user';
            $uploadedBy = Auth::guard('web')->id();
        } elseif (Auth::guard('admin')->check()) {
            $uploadedByType = 'user';
            $uploadedBy = Auth::guard('admin')->id();
        }

        return TicketAttachment::create([
            'ticket_id' => $ticket->id,
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'uploaded_by_type' => $uploadedByType,
            'uploaded_by' => $uploadedBy,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public static function destroy(TicketAttachment $attachment): bool
    {
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        return (bool) $attachment->delete();
    }
}
