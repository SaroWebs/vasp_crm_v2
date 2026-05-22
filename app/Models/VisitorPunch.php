<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorPunch extends Model
{
    protected $table = 'visitor_punches';

    public $timestamps = true;

    protected $fillable = [
        'visitor_code',
        'machine_id',
        'punch_time',
        'ip',
        'is_live',
    ];

    protected function casts(): array
    {
        return [
            'punch_time' => 'datetime',
            'is_live' => 'boolean',
        ];
    }

    /**
     * Get the visitor that owns this punch
     */
    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class, 'visitor_code', 'code');
    }
}
