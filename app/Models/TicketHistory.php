<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class TicketHistory extends Model
{
    protected $guarded=[];

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
