import axios from 'axios';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    status: 'read' | 'unread';
    type: string;
    type_key?: string;
    icon?: string;
    color?: string;
    target_url?: string | null;
    target_type?: string | null;
    created_at: string;
    updated_at: string;
    read_at?: string | null;
    data?: unknown;
}

interface NotificationData {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
}

interface NotificationResponsePayload {
    notifications?: NotificationItem[];
    total?: number;
    total_unread?: number;
    unread_count?: number;
}

interface NotificationContextValue extends NotificationData {
    loading: boolean;
    refreshNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
    undefined,
);

function normalizeNotificationData(
    payload: NotificationResponsePayload,
): NotificationData {
    return {
        notifications: Array.isArray(payload.notifications)
            ? payload.notifications
            : [],
        total: typeof payload.total === 'number' ? payload.total : 0,
        unreadCount:
            typeof payload.total_unread === 'number'
                ? payload.total_unread
                : typeof payload.unread_count === 'number'
                  ? payload.unread_count
                  : 0,
    };
}

interface NotificationProviderProps {
    children: ReactNode;
    userId?: string | number | null;
} 

export function NotificationProvider({
    children,
    userId,
}: NotificationProviderProps) {
    const [data, setData] = useState<NotificationData>({
        notifications: [],
        total: 0,
        unreadCount: 0,
    });
    const [loading, setLoading] = useState(false);

    const applyNotificationData = useCallback(
        (payload: NotificationResponsePayload) => {
            setData(normalizeNotificationData(payload));
        },
        [],
    );

    const refreshNotifications = useCallback(async () => {
        if (!userId) {
            setData({
                notifications: [],
                total: 0,
                unreadCount: 0,
            });

            return;
        }

        setLoading(true);

        try {
            const response = await axios.get('/admin/notifications/data');
            applyNotificationData(response.data);
        } catch (error) {
            console.error('Unable to load notifications', error);
        } finally {
            setLoading(false);
        }
    }, [applyNotificationData, userId]);

    const markAsRead = useCallback(
        async (notificationId: string) => {
            if (!userId) {
                return;
            }

            await axios.patch(`/admin/notifications/${notificationId}/read`);

            setData((currentData) => {
                const wasUnread = currentData.notifications.some(
                    (notification) =>
                        notification.id === notificationId &&
                        notification.status === 'unread',
                );

                return {
                    ...currentData,
                    notifications: currentData.notifications.map(
                        (notification) =>
                            notification.id === notificationId
                                ? {
                                      ...notification,
                                      status: 'read',
                                      read_at:
                                          notification.read_at ??
                                          new Date().toISOString(),
                                  }
                                : notification,
                    ),
                    unreadCount: Math.max(
                        0,
                        currentData.unreadCount - (wasUnread ? 1 : 0),
                    ),
                };
            });
        },
        [userId],
    );

    const markAllAsRead = useCallback(async () => {
        if (!userId) {
            return;
        }

        await axios.post('/admin/notifications/mark-all-read');

        setData((currentData) => ({
            ...currentData,
            notifications: currentData.notifications.map((notification) =>
                notification.status === 'unread'
                    ? {
                          ...notification,
                          status: 'read',
                          read_at:
                              notification.read_at ?? new Date().toISOString(),
                      }
                    : notification,
            ),
            unreadCount: 0,
        }));
    }, [userId]);

    useEffect(() => {
        void refreshNotifications();
    }, [refreshNotifications]);

    useEffect(() => {
        if (!userId) {
            return;
        }

        if (typeof window === 'undefined' || !window.Echo) {
            const intervalId = window.setInterval(() => {
                void refreshNotifications();
            }, 30000);

            return () => window.clearInterval(intervalId);
        }

        const channel = window.Echo.private(`notifications.${userId}`);

        channel.listen(
            '.notification.created',
            (event: { notification: NotificationItem }) => {
                setData((currentData) => ({
                    ...currentData,
                    notifications: [
                        event.notification,
                        ...currentData.notifications,
                    ],
                    total: currentData.total + 1,
                    unreadCount: currentData.unreadCount + 1,
                }));
            },
        );

        channel.listen(
            '.notification.read',
            (event: { notification_id: string }) => {
                setData((currentData) => {
                    const wasUnread = currentData.notifications.some(
                        (notification) =>
                            notification.id === event.notification_id &&
                            notification.status === 'unread',
                    );

                    return {
                        ...currentData,
                        notifications: currentData.notifications.map(
                            (notification) =>
                                notification.id === event.notification_id
                                    ? {
                                          ...notification,
                                          status: 'read',
                                          read_at:
                                              notification.read_at ??
                                              new Date().toISOString(),
                                      }
                                    : notification,
                        ),
                        unreadCount: Math.max(
                            0,
                            currentData.unreadCount - (wasUnread ? 1 : 0),
                        ),
                    };
                });
            },
        );

        return () => {
            window.Echo?.leave(`notifications.${userId}`);
        };
    }, [refreshNotifications, userId]);

    const value = useMemo<NotificationContextValue>(
        () => ({
            notifications: data.notifications,
            total: data.total,
            unreadCount: data.unreadCount,
            loading,
            refreshNotifications,
            markAsRead,
            markAllAsRead,
        }),
        [
            data.notifications,
            data.total,
            data.unreadCount,
            loading,
            markAllAsRead,
            markAsRead,
            refreshNotifications,
        ],
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): NotificationContextValue {
    const context = useContext(NotificationContext);

    if (context === undefined) {
        throw new Error(
            'useNotifications must be used within a NotificationProvider',
        );
    }

    return context;
}
