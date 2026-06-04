<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'duration_type',
        'default_hours',
        'requires_approval',
        'is_paid',
        'carry_over_allowed',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_hours' => 'decimal:2',
            'requires_approval' => 'boolean',
            'is_paid' => 'boolean',
            'carry_over_allowed' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function getDailyLeaveHours(): float
    {
        $defaultHours = (float) ($this->default_hours ?? 8);

        if ($defaultHours <= 0 || $defaultHours > 24) {
            return 8.0;
        }

        return $defaultHours;
    }

    public function getConsumptionHoursPerDay(): float
    {
        $hoursPerDay = $this->getDailyLeaveHours();

        if ($this->duration_type === 'half_day') {
            return round($hoursPerDay / 2, 2);
        }

        return round($hoursPerDay, 2);
    }

    public function getConsumptionHoursForDays(float $days): float
    {
        return round(max(0, $days) * $this->getConsumptionHoursPerDay(), 2);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeRequiresApproval(Builder $query): Builder
    {
        return $query->where('requires_approval', true);
    }
}
