<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'card_number', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Check if a code belongs to a visitor
     */
    public static function isVisitor($cardCode): bool
    {
        return self::where('code', $cardCode)->exists();
    }

    /**
     * Get all punches for this visitor
     */
    public function punches(): HasMany
    {
        return $this->hasMany(VisitorPunch::class, 'visitor_code', 'code');
    }

    /**
     * Get last punch for this visitor
     */
    public function lastPunch()
    {
        return $this->punches()->latest('punch_time')->first();
    }
}
