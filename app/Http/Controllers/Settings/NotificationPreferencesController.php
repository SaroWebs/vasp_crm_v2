<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\UserNotificationPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationPreferencesController extends Controller
{
    /**
     * Display the user's notification preferences.
     */
    public function edit()
    {
        $user = Auth::user();
        $preferences = UserNotificationPreference::getOrCreateForUser($user->id);

        return Inertia::render('settings/notifications', [
            'preferences' => [
                'notify_via_pusher' => $preferences->notify_via_pusher,
                'notify_via_whatsapp' => $preferences->notify_via_whatsapp,
                'notify_via_sms' => $preferences->notify_via_sms,
                'notify_via_email' => $preferences->notify_via_email,
                'whatsapp_number' => $preferences->whatsapp_number,
                'sms_number' => $preferences->sms_number,
            ],
        ]);
    }

    /**
     * Update the user's notification preferences.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'notify_via_pusher' => 'boolean',
            'notify_via_whatsapp' => 'boolean',
            'notify_via_sms' => 'boolean',
            'notify_via_email' => 'boolean',
            'whatsapp_number' => 'nullable|string|max:20',
            'sms_number' => 'nullable|string|max:20',
        ]);

        $user = Auth::user();
        $preferences = UserNotificationPreference::getOrCreateForUser($user->id);

        $preferences->update([
            'notify_via_pusher' => $validated['notify_via_pusher'] ?? true,
            'notify_via_whatsapp' => $validated['notify_via_whatsapp'] ?? false,
            'notify_via_sms' => $validated['notify_via_sms'] ?? false,
            'notify_via_email' => $validated['notify_via_email'] ?? true,
            'whatsapp_number' => $validated['whatsapp_number'] ?? null,
            'sms_number' => $validated['sms_number'] ?? null,
        ]);

        return back()->with('success', 'Notification preferences updated successfully.');
    }
}