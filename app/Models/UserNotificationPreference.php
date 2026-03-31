<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotificationPreference extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'user_notification_preferences';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'notify_via_pusher',
        'notify_via_whatsapp',
        'notify_via_sms',
        'notify_via_email',
        'whatsapp_number',
        'sms_number',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_id' => 'integer',
        'notify_via_pusher' => 'boolean',
        'notify_via_whatsapp' => 'boolean',
        'notify_via_sms' => 'boolean',
        'notify_via_email' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the notification preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get or create preferences for a user.
     */
    public static function getOrCreateForUser(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            [
                'notify_via_pusher' => true,
                'notify_via_whatsapp' => false,
                'notify_via_sms' => false,
                'notify_via_email' => true,
            ]
        );
    }

    /**
     * Check if any external notification channel is enabled.
     */
    public function hasExternalNotificationEnabled(): bool
    {
        return $this->notify_via_whatsapp || $this->notify_via_sms || $this->notify_via_email;
    }

    /**
     * Get the preferred phone number for WhatsApp.
     */
    public function getWhatsAppNumber(): ?string
    {
        if ($this->notify_via_whatsapp && $this->whatsapp_number) {
            return $this->whatsapp_number;
        }

        return null;
    }

    /**
     * Get the preferred phone number for SMS.
     */
    public function getSmsNumber(): ?string
    {
        if ($this->notify_via_sms && $this->sms_number) {
            return $this->sms_number;
        }

        return null;
    }
}