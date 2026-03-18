# Real-time Comments Setup with Laravel Reverb

This document explains how to set up real-time comments using Laravel Reverb WebSockets.

## Environment Configuration

Add the following to your `.env` file:

```env
# Broadcasting
BROADCAST_CONNECTION=reverb

# Reverb Configuration
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http

# For Vite (frontend)
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### Generate Keys

You can generate random keys using:
```bash
php artisan reverb:install
```

Or manually generate them:
- `REVERB_APP_ID`: Any unique identifier (e.g., `123456`)
- `REVERB_APP_KEY`: Random string (e.g., `laravel-reverb-key`)
- `REVERB_APP_SECRET`: Random secret (e.g., `laravel-reverb-secret`)

## Running Reverb

Start the Reverb WebSocket server:

```bash
php artisan reverb:start
```

For development with verbose output:
```bash
php artisan reverb:start --debug
```

## Running the Queue Worker

Broadcasting events are queued by default. Run the queue worker:

```bash
php artisan queue:work
```

## Development Script

Update your `composer.json` dev script to include Reverb:

```json
"dev": [
    "Composer\\Config::disableProcessTimeout",
    "npx concurrently -c \"#93c5fd,#c4b5fd,#fdba74,#86efac\" \"php artisan serve\" \"php artisan queue:listen --tries=1\" \"npm run dev\" \"php artisan reverb:start\" --names='server,queue,vite,reverb'"
]
```

## How It Works

1. When a user posts a comment, the `TicketCommentController` broadcasts a `TicketCommentCreated` event
2. The event is sent to the private channel `ticket.{ticketId}`
3. Other users subscribed to that channel receive the comment in real-time
4. The frontend uses Laravel Echo to listen for these events

## Files Modified/Created

- `config/reverb.php` - Reverb configuration
- `config/broadcasting.php` - Broadcasting configuration
- `routes/channels.php` - Channel authorization
- `app/Events/TicketCommentCreated.php` - Broadcast event
- `app/Http/Controllers/TicketCommentController.php` - Broadcasts on comment creation
- `resources/js/echo.ts` - Laravel Echo setup
- `resources/js/app.tsx` - Imports Echo
- `resources/js/components/ticket-comments.tsx` - Real-time comment updates

## Production Considerations

For production, consider:
1. Using HTTPS/WSS (`REVERB_SCHEME=https`)
2. Running Reverb behind a reverse proxy (Nginx)
3. Using Supervisor to keep Reverb running
4. Scaling with Redis for multiple Reverb instances
