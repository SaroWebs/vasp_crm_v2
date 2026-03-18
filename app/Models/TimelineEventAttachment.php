<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimelineEventAttachment extends Model
{
    protected $fillable = [
        'timeline_event_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function timelineEvent()
    {
        return $this->belongsTo(TimelineEvent::class);
    }
}