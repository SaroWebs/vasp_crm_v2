<?php

namespace App\Models;

use Database\Factories\EmployeeTerminationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeTermination extends Model
{
    /** @use HasFactory<EmployeeTerminationFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'status',
        'termination_type',
        'effective_date',
        'reason',
        'notes',
        'created_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
