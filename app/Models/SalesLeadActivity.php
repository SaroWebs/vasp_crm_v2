<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesLeadActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_lead_id',
        'user_id',
        'activity_type',
        'outcome_status',
        'response_text',
        'activity_at',
        'next_follow_up_at',
    ];

    protected function casts(): array
    {
        return [
            'activity_at' => 'datetime',
            'next_follow_up_at' => 'datetime',
        ];
    }

    public function salesLead(): BelongsTo
    {
        return $this->belongsTo(SalesLead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getLogName(): string
    {
        return 'Sales Lead Activity';
    }
}
