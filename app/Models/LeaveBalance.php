<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'year',
        'opening_balance',
        'allocated_hours',
        'used_hours',
        'closing_balance',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'allocated_hours' => 'decimal:2',
            'used_hours' => 'decimal:2',
            'closing_balance' => 'decimal:2',
        ];
    }

    protected function appends(): array
    {
        return ['remaining_hours', 'carried_over_hours'];
    }

    public function getRemainingHoursAttribute(): float
    {
        return max(0, floatval($this->allocated_hours) - floatval($this->used_hours));
    }

    public function getCarriedOverHoursAttribute(): float
    {
        return floatval($this->opening_balance) ?? 0;
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function scopeForEmployee(Builder $query, int|Employee $employee): Builder
    {
        $employeeId = $employee instanceof Employee ? $employee->id : $employee;

        return $query->where('employee_id', $employeeId);
    }

    public function scopeForYear(Builder $query, int $year): Builder
    {
        return $query->where('year', $year);
    }

    public function scopeForLeaveType(Builder $query, int|LeaveType $leaveType): Builder
    {
        $leaveTypeId = $leaveType instanceof LeaveType ? $leaveType->id : $leaveType;

        return $query->where('leave_type_id', $leaveTypeId);
    }

    public function getAvailableBalance(): float
    {
        return max(0, floatval($this->closing_balance) - floatval($this->used_hours));
    }
}
