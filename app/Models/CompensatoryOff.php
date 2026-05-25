<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompensatoryOff extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'comp_off_hours',
        'source_holiday_work_id',
        'used_for_leave_request_id',
        'status',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'comp_off_hours' => 'decimal:2',
            'expiry_date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function sourceHolidayWork(): BelongsTo
    {
        return $this->belongsTo(HolidayWorkRecord::class, 'source_holiday_work_id');
    }

    public function usedForLeaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class, 'used_for_leave_request_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }
}
