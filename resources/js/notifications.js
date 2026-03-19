// Pusher Notifications Integration
// This file demonstrates how to listen to real-time notifications using Pusher

import { createApp } from 'vue';
import Echo from 'laravel-echo';

// Initialize Pusher connection via Laravel Echo
const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
});

// User authentication
const userId = document.querySelector('meta[name="user-id"]')?.content;

// Notification store (for Vue.js integration)
const notificationStore = {
    state: {
        notifications: [],
        unreadCount: 0,
    },
    addNotification(notification) {
        this.state.notifications.unshift(notification);
        if (!notification.read_at) {
            this.state.unreadCount++;
            this.showBrowserNotification(notification);
        }
        this.saveToLocalStorage();
    },
    markAsRead(notificationId) {
        const notification = this.state.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read_at = new Date().toISOString();
            this.state.unreadCount = Math.max(0, this.state.unreadCount - 1);
            this.saveToLocalStorage();
        }
    },
    markAllAsRead() {
        this.state.notifications.forEach(notification => {
            notification.read_at = notification.read_at || new Date().toISOString();
        });
        this.state.unreadCount = 0;
        this.saveToLocalStorage();
    },
    saveToLocalStorage() {
        localStorage.setItem('notifications', JSON.stringify(this.state.notifications));
    },
    loadFromLocalStorage() {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            this.state.notifications = JSON.parse(saved);
            this.state.unreadCount = this.state.notifications.filter(n => !n.read_at).length;
        }
    },
    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification(notification.notification.title, {
                body: notification.notification.message,
                icon: '/favicon.ico',
                tag: notification.id
            });
            
            notif.onclick = () => {
                window.focus();
                this.markAsRead(notification.id);
                // Navigate to relevant page based on notification type
                this.navigateToNotification(notification);
                notif.close();
            };
            
            // Auto-close after 5 seconds
            setTimeout(() => notif.close(), 5000);
        }
    },
    navigateToNotification(notification) {
        // Implement navigation logic based on notification type
        if (notification.data && notification.data.task_id) {
            window.location.href = `/tasks/${notification.data.task_id}`;
        } else if (notification.data && notification.data.ticket_id) {
            window.location.href = `/tickets/${notification.data.ticket_id}`;
        }
    }
};

// Initialize notification store
notificationStore.loadFromLocalStorage();

// Listen to user-specific notifications channel
const userChannel = echo.private(`user.${userId}`);

// Listen for general notifications
userChannel.listen('notification.created', (event) => {
    console.log('New notification received:', event);
    notificationStore.addNotification(event);
    showNotificationToast(event);
});

// Listen for task-specific notifications
userChannel.listen('task.assigned', (event) => {
    console.log('Task assigned:', event);
    notificationStore.addNotification(event);
    showTaskNotification(event, 'Task Assigned');
});

userChannel.listen('task.status.changed', (event) => {
    console.log('Task status changed:', event);
    notificationStore.addNotification(event);
    showTaskNotification(event, 'Task Status Changed');
});

userChannel.listen('task.forwarded', (event) => {
    console.log('Task forwarded:', event);
    notificationStore.addNotification(event);
    showTaskNotification(event, 'Task Forwarded');
});

// Request notification permissions
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
        });
    }
}

// Show toast notification
function showNotificationToast(notification) {
    // You can integrate with your toast library here
    // Example with a simple DOM element:
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <strong>${notification.notification.title}</strong>
            <p>${notification.notification.message}</p>
        </div>
        <button class="toast-close">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
    
    // Click to dismiss
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Click to mark as read and navigate
    toast.addEventListener('click', () => {
        notificationStore.markAsRead(notification.id);
        toast.remove();
        notificationStore.navigateToNotification(notification);
    });
}

// Show task-specific notification
function showTaskNotification(event, title) {
    const taskData = event.task_assigned || event.task_status_changed || event.task_forwarded;
    const message = taskData ? `Task: ${taskData.task_title}` : event.notification.message;
    
    showNotificationToast({
        ...event,
        notification: {
            ...event.notification,
            title,
            message
        }
    });
}

// Initialize
requestNotificationPermission();

// Expose to global scope for Vue.js integration
window.notificationStore = notificationStore;

// Vue.js component example (if using Vue)
if (typeof Vue !== 'undefined') {
    const app = createApp({
        data() {
            return {
                notifications: notificationStore.state.notifications,
                unreadCount: notificationStore.state.unreadCount,
                showDropdown: false
            };
        },
        methods: {
            markAsRead(notificationId) {
                notificationStore.markAsRead(notificationId);
                this.unreadCount = notificationStore.state.unreadCount;
            },
            markAllAsRead() {
                notificationStore.markAllAsRead();
                this.unreadCount = 0;
            },
            toggleDropdown() {
                this.showDropdown = !this.showDropdown;
            }
        }
    });
    
    app.mount('#notification-component');
}

// Export for module usage
export { notificationStore, echo };