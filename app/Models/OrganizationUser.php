<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class OrganizationUser extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'name',
        'email',
        'designation',
        'phone',
        'status',
    ];

    protected static function booted(): void
    {
        static::saving(function (OrganizationUser $organizationUser): void {
            if ($organizationUser->email) {
                $organizationUser->email = Str::lower(trim($organizationUser->email));
            }
        });
    }

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
