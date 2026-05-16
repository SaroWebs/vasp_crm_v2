<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Office extends Model
{
    protected $fillable = [
        'name',
        'whatsapp_number',
        'address',
        'email',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_offices')
            ->withPivot('is_active')
            ->withTimestamps();
    }
}
