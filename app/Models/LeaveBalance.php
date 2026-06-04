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
        'opening_leaves',
        'assigned_leaves',
        'consumed_leaves',
        'remaining_leaves',
    ];

    protected function casts(): array
    {
        return [
            'opening_leaves' => 'integer',
            'assigned_leaves' => 'integer',
            'consumed_leaves' => 'integer',
            'remaining_leaves' => 'integer',
        ];
    }

    protected function appends(): array
    {
        return ['carried_over_leaves'];
    }

    public function getCarriedOverLeavesAttribute(): int
    {
        return (int) ($this->attributes['opening_leaves'] ?? 0);
    }

    public function getAvailableBalance(): int
    {
        return max(0, (int) ($this->attributes['remaining_leaves'] ?? 0));
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
}
