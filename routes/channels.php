<?php

use App\Models\OrganizationUser;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::post('/broadcasting/auth', function (Request $request) {
    return Broadcast::auth($request);
})->middleware(['web', 'auth:organization,web']);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Ticket comments channel - allows authenticated users to listen to ticket updates
Broadcast::channel('ticket.{ticketId}', function ($user, $ticketId) {
    if ($user instanceof OrganizationUser) {
        return Ticket::query()
            ->where('id', (int) $ticketId)
            ->where('organization_user_id', (int) $user->id)
            ->exists();
    }

    if (Auth::guard('web')->check() || Auth::guard('admin')->check()) {
        return true;
    }

    return false;
}, ['guards' => ['organization', 'web', 'admin']]);
