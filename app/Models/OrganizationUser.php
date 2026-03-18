<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationUser extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'name',
        'email',
        'designation',
        'phone',
        'status',
    ];

    /**
     * Get the organization this user belongs to.
     */
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the tickets created by this organization user.
     */
    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'organization_user_id');
    }
}
