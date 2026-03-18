<?php

use App\Models\Ticket;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Auth;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Ticket comments channel - allows authenticated users to listen to ticket updates
Broadcast::channel('ticket.{ticketId}', function ($user, $ticketId) {
    // Check if user is authenticated via any guard
    if (Auth::guard('web')->check() || Auth::guard('admin')->check()) {
        // Admin/Staff can access any ticket
        return true;
    }
    
    return false;
});
