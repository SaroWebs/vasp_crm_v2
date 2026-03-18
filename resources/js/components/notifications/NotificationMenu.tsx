import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge, Button } from '../ui';
import { Bell, CheckCircle, XCircle, UserPlus, Check, Users, Info } from 'lucide-react';
import { Link, router } from '@inertiajs/react';

type Props = {};

interface NotificationData {
    notifications: Note[];
    total: number;
    total_unread: number;
}

interface Note {
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
    data?: any;
}

const NotificationMenu = (_props: Props) => {
    const [data, setData] = useState<NotificationData>({
        notifications: [],
        total: 0,
        total_unread: 0,
    });
    const [loading, setLoading] = useState(false);

    const getIcon = (note: Note) => {
        const iconType = note.icon ?? note.type_key ?? note.type;

        const icons: { [key: string]: React.ReactNode } = {
            ticket_created: <CheckCircle className="h-4 w-4 text-blue-500" />,
            ticket_approved: <CheckCircle className="h-4 w-4 text-green-500" />,
            ticket_rejected: <XCircle className="h-4 w-4 text-red-500" />,
            task_assigned: <UserPlus className="h-4 w-4 text-purple-500" />,
            task_completed: <Check className="h-4 w-4 text-green-500" />,
            department_assigned: <Users className="h-4 w-4 text-indigo-500" />,
            system: <Info className="h-4 w-4 text-gray-500" />,
            ticket: <CheckCircle className="h-4 w-4 text-blue-500" />,
            'check-circle': <CheckCircle className="h-4 w-4 text-green-500" />,
            'x-circle': <XCircle className="h-4 w-4 text-red-500" />,
            'user-plus': <UserPlus className="h-4 w-4 text-purple-500" />,
            check: <Check className="h-4 w-4 text-green-500" />,
            users: <Users className="h-4 w-4 text-indigo-500" />,
            info: <Info className="h-4 w-4 text-gray-500" />,
            'App\\Notifications\\TaskAssignedNotification': <UserPlus className="h-4 w-4 text-purple-500" />,
            'App\\Notifications\\TicketCreatedNotification': <CheckCircle className="h-4 w-4 text-blue-500" />,
        };

        return icons[iconType] || <Bell className="h-4 w-4 text-gray-500" />;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/notifications/data');
            setData(res.data);
        } catch (err) {
            console.error('Unable to get notifications', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNotification = async (note: Note) => {
        if (note.status === 'unread') {
            try {
                await axios.patch(`/admin/notifications/${note.id}/read`);
                setData((prevData) => ({
                    ...prevData,
                    notifications: prevData.notifications.map((n) =>
                        n.id === note.id
                            ? { ...n, status: 'read', read_at: new Date().toISOString() }
                            : n,
                    ),
                    total_unread: Math.max(0, prevData.total_unread - 1),
                }));
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }

        if (note.target_url) {
            router.visit(note.target_url);
        }
    };

    useEffect(() => {
        void getData();

        const intervalId = window.setInterval(() => {
            void getData();
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {data ? (
                        <Badge variant="destructive" className="ml-2">
                            {data.total_unread || 0}
                        </Badge>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-4 w-80 max-h-96 overflow-y-auto">
                {loading ? (
                    <DropdownMenuItem className="p-3 text-sm text-muted-foreground">
                        Loading notifications...
                    </DropdownMenuItem>
                ) : null}
                {!loading && data.notifications?.length === 0 ? (
                    <DropdownMenuItem className="p-3 text-sm text-muted-foreground">
                        No notifications yet.
                    </DropdownMenuItem>
                ) : null}
                {!loading && data.notifications?.length > 0
                    ? data.notifications.map((note) => (
                          <DropdownMenuItem
                              onClick={() => void handleOpenNotification(note)}
                              key={note.id}
                              className="flex items-start space-x-3 p-3"
                          >
                              <div className="mt-0.5 shrink-0">{getIcon(note)}</div>
                              <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-gray-900">
                                      {note.title}
                                  </p>
                                  {note.target_url ? (
                                      <Link
                                          href={note.target_url}
                                          className="line-clamp-2 block text-xs text-blue-600 hover:underline"
                                          onClick={(event) => event.stopPropagation()}
                                      >
                                          {note.message}
                                      </Link>
                                  ) : (
                                      <p className="line-clamp-2 text-xs text-gray-500">
                                          {note.message}
                                      </p>
                                  )}
                                  <p className="mt-1 text-xs text-gray-400">
                                      {formatTime(note.created_at)}
                                  </p>
                                  {note.target_url ? (
                                      <p className="mt-1 text-xs font-medium text-blue-600">
                                          Open {note.target_type ?? 'item'}
                                      </p>
                                  ) : null}
                              </div>
                              {note.status === 'unread' ? (
                                  <div className="shrink-0">
                                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                                  </div>
                              ) : null}
                          </DropdownMenuItem>
                      ))
                    : null}
                <DropdownMenuItem asChild>
                    <Link href="/admin/notifications" className="text-center text-sm text-blue-600 hover:text-blue-800">
                        View All Notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationMenu;
