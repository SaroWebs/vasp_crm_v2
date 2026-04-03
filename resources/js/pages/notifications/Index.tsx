import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { Bell } from 'lucide-react';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    status: 'read' | 'unread';
    type: string;
    created_at: string;
    target_url?: string | null;
    target_type?: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface NotificationsPayload {
    data: NotificationItem[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
}

interface NotificationPageProps {
    notifications: NotificationsPayload;
    filters: {
        status?: string;
        type?: string;
    };
    counts: {
        unread: number;
        read: number;
        total: number;
    };
}

type NotificationsIndexContentProps = Pick<
    NotificationPageProps,
    'notifications' | 'counts'
>;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/admin/notifications',
    },
];

function normalizeLabel(label: string): string {
    return label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next')
        .replace('&amp;', '&');
}

export default function NotificationsIndex({
    notifications,
    counts,
}: NotificationPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <NotificationsIndexContent
                notifications={notifications}
                counts={counts}
            />
        </AppLayout>
    );
}

function NotificationsIndexContent({
    notifications,
    counts,
}: NotificationsIndexContentProps) {
    const { unreadCount, refreshNotifications } = useNotifications();

    const openNotificationTarget = (targetUrl?: string | null) => {
        if (targetUrl) {
            router.visit(targetUrl);
        }
    };

    const refreshPage = () =>
        router.reload({
            only: ['notifications', 'counts'],
        });

    const markAllAsRead = async () => {
        await axios.post('/admin/notifications/mark-all-read');
        await refreshNotifications();
        refreshPage();
    };

    const markAsRead = async (id: string) => {
        await axios.patch(`/admin/notifications/${id}/read`);
        await refreshNotifications();
        refreshPage();
    };

    const deleteNotification = async (id: string) => {
        await axios.delete(`/api/notifications/${id}`);
        await refreshNotifications();
        refreshPage();
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review and manage recent alerts.
                    </p>
                </div>
                <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
                    Mark All As Read
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Badge variant="outline">Total: {counts.total}</Badge>
                <Badge variant="destructive">Unread: {unreadCount}</Badge>
                <Badge variant="secondary">Read: {counts.read}</Badge>
            </div>

            <div className="rounded-lg border bg-card">
                {notifications.data.length === 0 ? (
                    <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                        <Bell className="h-4 w-4" />
                        No notifications found.
                    </div>
                ) : (
                    notifications.data.map((notification) => (
                        <div
                            key={notification.id}
                            className={`flex items-start justify-between gap-3 border-b p-4 last:border-b-0 ${
                                notification.target_url
                                    ? 'cursor-pointer hover:bg-muted/40'
                                    : ''
                            }`}
                            onClick={() =>
                                openNotificationTarget(notification.target_url)
                            }
                        >
                            <div className="min-w-0 flex-1">
                                {notification.target_url ? (
                                    <Link
                                        href={notification.target_url}
                                        className="text-sm font-medium text-blue-600 hover:underline"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        {notification.title}
                                    </Link>
                                ) : (
                                    <p className="text-sm font-medium">
                                        {notification.title}
                                    </p>
                                )}
                                {notification.target_url ? (
                                    <Link
                                        href={notification.target_url}
                                        className="mt-1 block text-sm text-blue-600 hover:underline"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                    >
                                        {notification.message}
                                    </Link>
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {notification.message}
                                    </p>
                                )}
                                {notification.target_url ? (
                                    <p className="mt-1 text-xs text-blue-600">
                                        Open {notification.target_type ?? 'item'}
                                    </p>
                                ) : null}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {new Date(
                                        notification.created_at,
                                    ).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        notification.status === 'unread'
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    {notification.status}
                                </Badge>
                                {notification.status === 'unread' ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void markAsRead(notification.id);
                                        }}
                                    >
                                        Mark Read
                                    </Button>
                                ) : null}
                                {notification.target_url ? (
                                    <Button size="sm" variant="outline" asChild>
                                        <Link
                                            href={notification.target_url}
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >
                                            Open
                                        </Link>
                                    </Button>
                                ) : null}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void deleteNotification(notification.id);
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {notifications.links?.length > 3 ? (
                <div className="flex flex-wrap gap-2">
                    {notifications.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            onClick={() =>
                                link.url &&
                                router.visit(link.url, {
                                    preserveScroll: true,
                                })
                            }
                        >
                            {normalizeLabel(link.label)}
                        </Button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
