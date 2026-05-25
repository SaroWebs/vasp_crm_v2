<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HolidayWorkRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'holiday_id',
        'hours_worked',
        'premium_multiplier',
        'status',
        'approved_by_user_id',
        'notes',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'hours_worked' => 'decimal:2',
            'premium_multiplier' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function holiday(): BelongsTo
    {
        return $this->belongsTo(Holiday::class);
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function generateCompOffHours(): float
    {
        return floatval($this->hours_worked) * floatval($this->premium_multiplier);
    }
}
