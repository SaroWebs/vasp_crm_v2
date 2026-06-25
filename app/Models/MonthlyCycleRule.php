<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyCycleRule extends Model
{
    protected $fillable = [
        'month_starts_on',
        'effective_from',
        'effective_to',
        'include_gap_in_current',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'month_starts_on' => 'integer',
            'effective_from' => 'date',
            'effective_to' => 'date',
            'include_gap_in_current' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if this rule is currently active (no effective_to, or effective_to is in the future).
     */
    public function isActive(): bool
    {
        return $this->effective_to === null || $this->effective_to->isFuture();
    }
}
