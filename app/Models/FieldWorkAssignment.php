<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldWorkAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'start_date',
        'end_date',
        'location',
        'description',
        'custom_start_time',
        'custom_end_time',
        'assigned_by_user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function scopeForEmployee(Builder $query, int|Employee $employee): Builder
    {
        $employeeId = $employee instanceof Employee ? $employee->id : $employee;

        return $query->where('employee_id', $employeeId);
    }

    public function scopeForDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('start_date', [$startDate, $endDate])
            ->orWhereBetween('end_date', [$startDate, $endDate])
            ->orWhere(function (Builder $q) use ($startDate, $endDate) {
                $q->where('start_date', '<=', $startDate)
                    ->where('end_date', '>=', $endDate);
            });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('end_date', '>=', now()->toDateString());
    }

    public function getDaysCount(): int
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }

    public function getWorkingHours(): array
    {
        if ($this->custom_start_time && $this->custom_end_time) {
            return [
                'start' => $this->custom_start_time,
                'end' => $this->custom_end_time,
            ];
        }

        // Return default working hours from config
        return [
            'start' => '09:00',
            'end' => '18:00',
        ];
    }
}
