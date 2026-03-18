<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Product;

class Client extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'code',
        'address',
        'status',
        'product_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * Get the organization's users.
     */
    public function organizationUsers()
    {
        return $this->hasMany(OrganizationUser::class);
    }

    /**
     * Get the organization's tickets.
     */
    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get the product the client belongs to.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
