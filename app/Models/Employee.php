<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'code',
        'phone',
        'department_id',
        'user_id',
        'category_id',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function offices(): BelongsToMany
    {
        return $this->belongsToMany(Office::class, 'employee_offices')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    public function activeOffice(): BelongsToMany
    {
        return $this->offices()->wherePivot('is_active', true);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'employee_id', 'code');
    }

    public function shiftAssignments(): HasMany
    {
        return $this->hasMany(EmployeeShiftAssignment::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function remoteWorkRequests(): HasMany
    {
        return $this->hasMany(RemoteWorkRequest::class);
    }

    public function fieldWorkAssignments(): HasMany
    {
        return $this->hasMany(FieldWorkAssignment::class);
    }

    public function fieldWorkRequests(): HasMany
    {
        return $this->hasMany(FieldWorkRequest::class);
    }

    public function remoteWorkAssignments(): HasMany
    {
        return $this->hasMany(RemoteWorkAssignment::class);
    }

    public function holidayWorkRecords(): HasMany
    {
        return $this->hasMany(HolidayWorkRecord::class);
    }

    public function compensatoryOffs(): HasMany
    {
        return $this->hasMany(CompensatoryOff::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(EmployeeCategory::class);
    }

    public function currentShiftAssignment()
    {
        return $this->hasOne(EmployeeShiftAssignment::class)
            ->where('is_active', true)
            ->latest('effective_from');
    }

    public function recentShiftAssignments()
    {
        return $this->hasMany(EmployeeShiftAssignment::class)
            ->orderByDesc('effective_from')
            ->limit(5);
    }
}
