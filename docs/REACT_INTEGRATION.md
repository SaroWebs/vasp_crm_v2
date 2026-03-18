# React Integration Guide for Reverb Notifications

This guide shows how to integrate the Reverb notification system into your Inertia React dashboard.

## 1. Install Required Dependencies

```bash
npm install @reverb/client lucide-react
```

## 2. Update Your Layout Component

Add the Notifications component to your main layout (e.g., `resources/js/Layouts/AppLayout.jsx`):

```jsx
import React from 'react';
import { Link } from '@inertiajs/react';
import Notifications from '@/Components/Notifications';

export default function AppLayout({ children, auth }) {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-semibold">
                                Your App
                            </Link>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {/* Add Notifications Component */}
                            <Notifications 
                                userId={auth.user.id}
                                userToken={document.querySelector('meta[name="user-token"]')?.content}
                            />
                            
                            {/* Other navigation items */}
                            <span className="text-gray-700">{auth.user.name}</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>
                {children}
            </main>
        </div>
    );
}
```

## 3. Add Meta Tags to Your Blade Layout

In your main Blade layout (e.g., `resources/views/layouts/app.blade.php`), add the user token meta tag:

```html
<head>
    <!-- Other head content -->
    <meta name="user-token" content="{{ auth()->check() ? auth()->user()->createToken('web')->plainTextToken : '' }}">
    <!-- Other meta tags -->
</head>
```

## 4. Configure Broadcasting

Update your `config/broadcasting.php` to use Reverb:

```php
'connections' => [
    'reverb' => [
        'driver' => 'reverb',
        'key' => env('REVERB_APP_KEY'),
        'secret' => env('REVERB_APP_SECRET'),
        'app_id' => env('REVERB_APP_ID'),
        'host' => env('REVERB_HOST'),
        'port' => env('REVERB_PORT', 8080),
        'scheme' => env('REVERB_SCHEME', 'https'),
        'use_ssl' => env('REVERB_SCHEME') === 'https',
    ],
],
```

## 5. Environment Configuration

Add these to your `.env` file:

```env
BROADCAST_DRIVER=reverb
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_APP_ID=your-app-id
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=https
```

## 6. Start Reverb Server

```bash
php artisan reverb:start
```

## 7. Usage Examples

### Sending Notifications from Controllers

```php
use App\Services\NotificationService;

$notificationService = app(NotificationService::class);

// Send task assignment notification
$notificationService->sendTaskAssignmentNotification(
    $taskId, 
    $assignedUserId, 
    $taskTitle, 
    $assignedByUserId
);

// Send task status change notification
$notificationService->sendTaskStatusChangeNotification(
    $taskId, 
    $taskTitle, 
    $newStatus, 
    $changedByUserId
);
```

### Custom Notifications

```php
$notificationService->sendToUser(
    $userId,
    'custom.notification.type',
    'Custom Title',
    'Custom message content',
    [
        'custom_data' => 'value',
        'task_id' => 123
    ]
);
```

## 8. Toast Notifications

The React component automatically shows toast notifications for real-time updates. You can customize the toast styling by modifying the `showToast` function in the component.

## 9. Browser Notifications

To enable browser notifications, users need to grant permission. The component includes logic for this, but you can customize it:

```jsx
// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
```

## 10. Testing

### Test Real-time Notifications

1. Start your Reverb server
2. Open your application in two different browser windows/tabs
3. Perform an action that triggers a notification (e.g., assign a task)
4. Verify that the notification appears in real-time in both windows

### Test API Endpoints

```bash
# Get notifications
curl /api/notifications

# Mark notification as read
curl -X POST /api/notifications/1/mark-read
```

## 11. Troubleshooting

### Reverb Connection Issues
- Ensure Reverb server is running
- Check firewall settings for port 8080
- Verify SSL configuration if using HTTPS

### Authentication Issues
- Ensure user token is properly set in meta tag
- Check that notifications are scoped to the correct user

### Missing Notifications
- Verify that broadcasting events are being fired
- Check Reverb server logs for errors
- Ensure private channel authentication is working

## 12. Performance Considerations

- Notifications are stored in localStorage for offline access
- Real-time updates only occur when the user is online
- Consider implementing pagination for large notification lists
- Use the cleanup job to remove old notifications regularly

## 13. Security

- All notification endpoints require authentication
- Users can only access their own notifications
- Private channels ensure notifications are only visible to intended recipients
- CSRF protection is handled by Laravel's built-in middleware

This integration provides a seamless real-time notification experience that matches your existing ticket comment system's Reverb implementation.