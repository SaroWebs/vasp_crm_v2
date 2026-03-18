import React, { useState, useEffect, useRef } from 'react';
import { createReverb } from '@reverb/client';
import { Bell, X, Check, CheckCircle, AlertCircle, Clock, User, Users } from 'lucide-react';

const Notifications = ({ userId, userToken }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [reverb, setReverb] = useState(null);
    const dropdownRef = useRef(null);

    // Initialize Reverb connection
    useEffect(() => {
        if (userId && userToken) {
            const reverbInstance = createReverb({
                host: window.location.hostname,
                port: 8080,
                secure: window.location.protocol === 'https:',
            });

            reverbInstance.connect({
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                }
            });

            setReverb(reverbInstance);

            // Load existing notifications
            loadNotifications();

            return () => {
                if (reverbInstance) {
                    reverbInstance.disconnect();
                }
            };
        }
    }, [userId, userToken]);

    // Setup Reverb listeners
    useEffect(() => {
        if (!reverb || !userId) return;

        const userChannel = reverb.private(`user.${userId}`);

        // Listen for general notifications
        userChannel.listen('notification.created', (event) => {
            addNotification(event);
            showToast(event);
        });

        // Listen for task-specific notifications
        userChannel.listen('task.assigned', (event) => {
            addNotification(event);
            showToast(event, 'Task Assigned');
        });

        userChannel.listen('task.status.changed', (event) => {
            addNotification(event);
            showToast(event, 'Task Status Changed');
        });

        userChannel.listen('task.forwarded', (event) => {
            addNotification(event);
            showToast(event, 'Task Forwarded');
        });

        return () => {
            userChannel.stopListening('notification.created');
            userChannel.stopListening('task.assigned');
            userChannel.stopListening('task.status.changed');
            userChannel.stopListening('task.forwarded');
        };
    }, [reverb, userId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications`, {
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.data || []);
                setUnreadCount(data.data.filter(n => !n.read_at).length);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        saveToLocalStorage([notification, ...notifications]);
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`/api/notifications/${notificationId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                }
            });

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId
                        ? { ...n, read_at: new Date().toISOString() }
                        : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            saveToLocalStorage(notifications.map(n =>
                n.id === notificationId
                    ? { ...n, read_at: new Date().toISOString() }
                    : n
            ));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`/api/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                }
            });

            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
            );
            setUnreadCount(0);
            saveToLocalStorage(notifications.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const saveToLocalStorage = (notificationsList) => {
        localStorage.setItem('notifications', JSON.stringify(notificationsList));
    };

    const getNotificationIcon = (notification) => {
        const taskData = notification.task_assigned || notification.task_status_changed || notification.task_forwarded;
        const departmentData = notification.data?.department_name;

        if (taskData) {
            return <CheckCircle className="w-5 h-5 text-blue-600" />;
        } else if (departmentData) {
            return <Users className="w-5 h-5 text-purple-600" />;
        } else {
            return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const getNotificationColor = (notification) => {
        const taskData = notification.task_assigned || notification.task_status_changed || notification.task_forwarded;
        const departmentData = notification.data?.department_name;

        if (taskData) {
            return 'border-blue-200 bg-blue-50';
        } else if (departmentData) {
            return 'border-purple-200 bg-purple-50';
        } else {
            return 'border-gray-200 bg-gray-50';
        }
    };

    const showToast = (notification, title = null) => {
        // Create toast element
        const toastContainer = document.getElementById('toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-right-2 duration-300';
        
        const taskData = notification.task_assigned || notification.task_status_changed || notification.task_forwarded;
        const message = taskData ? taskData.task_title : (notification.notification?.message || '');
        const displayTitle = title || notification.notification?.title || 'New Notification';
        
        toast.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                        </svg>
                    </div>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${displayTitle}</p>
                    <p class="text-sm text-gray-600 mt-1">${message}</p>
                </div>
                <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 toast-close">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Click to dismiss
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    };

    const createToastContainer = () => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 space-y-2 z-50';
        document.body.appendChild(container);
        return container;
    };

    const navigateToNotification = (notification) => {
        const taskData = notification.task_assigned || notification.task_status_changed || notification.task_forwarded;
        const ticketData = notification.data?.ticket_id;

        if (taskData?.task_id) {
            window.location.href = `/tasks/${taskData.task_id}`;
        } else if (ticketData) {
            window.location.href = `/tickets/${ticketData}`;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Icon */}
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                
                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button 
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Mark all read
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div 
                                    key={notification.id}
                                    onClick={() => {
                                        markAsRead(notification.id);
                                        navigateToNotification(notification);
                                    }}
                                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        !notification.read_at ? 'bg-gray-50' : ''
                                    }`}
                                >
                                    {/* Notification Content */}
                                    <div className="flex items-start space-x-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0">
                                            {getNotificationIcon(notification)}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.notification?.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.notification?.message}
                                            </p>
                                            
                                            {/* Task/Department Info */}
                                            {notification.data?.task_title && (
                                                <div className="mt-2 text-xs text-blue-600 font-medium">
                                                    Task: {notification.data.task_title}
                                                </div>
                                            )}
                                            
                                            {notification.data?.department_name && (
                                                <div className="mt-2 text-xs text-purple-600 font-medium">
                                                    Department: {notification.data.department_name}
                                                </div>
                                            )}
                                            
                                            {/* Time */}
                                            <p className="text-xs text-gray-500 mt-2">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p>No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;