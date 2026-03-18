<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketAttachment extends Model
{
    protected $fillable = [
        'ticket_id',
        'file_path',
        'file_type',
        'uploaded_by_type',
        'uploaded_by',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
