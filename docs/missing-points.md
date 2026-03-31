# Missing Points: Pusher/Notification with WhatsApp Integration

## Current State Analysis

### What's Already Implemented

**WhatsApp Integration:**
- [`sendWhatsApp()`](app/Services/NotificationService.php:460) - sends to external WhatsApp API
- [`sendSms()`](app/Services/NotificationService.php:531) - fallback SMS
- [`sendEmail()`](app/Services/NotificationService.php:577) - fallback email
- [`sendEmployeeNotification()`](app/Services/NotificationService.php:598) - main method that tries WhatsApp first, then SMS, then email

**Pusher/Real-time Notifications:**
- Pusher configured in [`config/broadcasting.php`](config/broadcasting.php:33)
- Events: [`NotificationEvent`](app/Events/NotificationEvent.php), [`TaskAssignedNotificationEvent`](app/Events/TaskAssignedNotificationEvent.php), etc.
- [`Notification`](app/Models/Notification.php) model extends DatabaseNotification
- NotificationService has [`sendToUser()`](app/Services/NotificationService.php:23) that broadcasts notifications
- Laravel Echo and Pusher JS installed (`laravel-echo@2.2.6`, `pusher-js@8.4.0`)
- Notification channels exist in [`routes/channels.php`](routes/channels.php)
- [`NotificationController`](app/Http/Controllers/NotificationController.php) for managing notifications

---

## Missing Points for Side-by-Side Pusher + WhatsApp

### 1. Real-time Notification Broadcast Channel
**Missing:** A dedicated broadcast channel for user notifications in [`routes/channels.php`](routes/channels.php)

- Need to add: `Broadcast::channel('notifications.{userId}', ...)` to receive real-time notification events
- Currently, there's a `user.{id}` channel but it's not specifically used for notifications

### 2. Frontend Real-time Notification Listener
**Missing:** The [`NotificationMenu.tsx`](resources/js/components/notifications/NotificationMenu.tsx:1) component does NOT listen for real-time Pusher events

- Currently fetches notifications via API (`/admin/notifications/data`) on load only
- No Echo/Pusher subscription to receive instant notifications
- Need to add: `window.Echo.private('notifications.{userId}').listen('.notification.created', ...)`

### 3. User Notification Preferences
**Missing:** No way to configure notification channel preferences per user

- No database table for user notification settings
- No UI to let users choose: In-app (Pusher), WhatsApp, SMS, Email, or multiple
- Need: `user_notification_preferences` table with columns like `user_id`, `notify_via_pusher`, `notify_via_whatsapp`, `notify_via_sms`, `notify_via_email`

### 4. Notification Channel Tracking
**Missing:** No way to track which channel was used to deliver a notification

- Notification model doesn't have a `channel` or `delivery_method` field
- Can't know if notification was sent via Pusher, WhatsApp, SMS, or Email
- Need: Add `channel` column to notifications table to track delivery method

### 5. Unified Notification Method
**Missing:** No method that sends to BOTH Pusher and WhatsApp simultaneously

- [`NotificationService`](app/Services/NotificationService.php) has separate methods:
  - `sendToUser()` - in-app only (with broadcasting)
  - `sendEmployeeNotification()` - external (WhatsApp/SMS/Email)
- Need: A unified method that accepts channel preferences and sends to multiple channels

### 6. WhatsApp Message Template Handling
**Missing:** No structured template system for WhatsApp messages

- Currently sends raw messages via [`sendWhatsApp()`](app/Services/NotificationService.php:460)
- No template management for different notification types (task assigned, ticket created, etc.)
- Consider: Template-based WhatsApp messages with variables

### 7. Notification Settings UI
**Missing:** Frontend page for users to configure notification preferences

- No page for users to enable/disable specific notification types
- No way to set WhatsApp number for receiving notifications
- Need: Settings page in user profile or notification preferences page

### 8. WhatsApp Phone Number Storage
**Missing:** User model doesn't store WhatsApp phone number

- [`User`](app/Models/User.php) model may have phone but no dedicated WhatsApp field
- Need: `whatsapp_number` column on users table or separate `user_whatsapp_preferences` table

---

## Summary of Required Changes

| Priority | Item | Type |
|----------|------|------|
| High | Real-time broadcast channel for notifications | Backend |
| High | Frontend Echo listener in NotificationMenu | Frontend |
| High | User notification preferences table & model | Database/Backend |
| Medium | Channel tracking in notifications | Database |
| Medium | Unified notification method (Pusher + WhatsApp) | Backend |
| Medium | User notification settings UI | Frontend |
| Low | WhatsApp phone number field on User | Database |
| Low | WhatsApp message templates | Backend |