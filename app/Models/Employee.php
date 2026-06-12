<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_ON_LEAVE = 'on_leave';

    public const STATUS_TERMINATED = 'terminated';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_ON_LEAVE,
        self::STATUS_TERMINATED,
    ];

    protected $fillable = [
        'name',
        'email',
        'code',
        'phone',
        'department_id',
        'user_id',
        'category_id',
        'status',
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

    public function termination(): HasOne
    {
        return $this->hasOne(EmployeeTermination::class)->latestOfMany();
    }

    public function terminations(): HasMany
    {
        return $this->hasMany(EmployeeTermination::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    public function scopeAssignable(Builder $query): Builder
    {
        return $query->active();
    }

    public function scopeAvailableForActivity(Builder $query): Builder
    {
        return $query->assignable();
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function isTerminated(): bool
    {
        return $this->status === self::STATUS_TERMINATED;
    }

    public function canReceiveFutureAssignments(): bool
    {
        return $this->isActive();
    }

    public function currentShiftAssignment(): HasOne
    {
        return $this->hasOne(EmployeeShiftAssignment::class)
            ->where('is_active', true)
            ->latest('effective_from');
    }

    public function recentShiftAssignments(): HasMany
    {
        return $this->hasMany(EmployeeShiftAssignment::class)
            ->orderByDesc('effective_from')
            ->limit(5);
    }
}
