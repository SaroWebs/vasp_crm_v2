<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesLead extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'owner_user_id',
        'product_id',
        'created_by_user_id',
        'updated_by_user_id',
        'organization_name',
        'organization_type',
        'contact_person_name',
        'contact_phone',
        'contact_email',
        'location',
        'service_notes',
        'interest_level',
        'status',
        'source',
        'latest_response',
        'last_contacted_at',
        'next_follow_up_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'last_contacted_at' => 'datetime',
            'next_follow_up_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(SalesLeadActivity::class);
    }

    public function scopeForOwner(Builder $query, int|User $owner): Builder
    {
        $ownerId = $owner instanceof User ? $owner->id : $owner;

        return $query->where('owner_user_id', $ownerId);
    }

    public function getLogName(): string
    {
        return 'Sales Lead';
    }
}
