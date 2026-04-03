import {
    useNotifications,
    type NotificationItem,
} from '@/context/NotificationContext';
import { Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCircle,
    Info,
    UserPlus,
    Users,
    XCircle,
} from 'lucide-react';
import React from 'react';
import { Badge, Button } from '../ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const NotificationMenu = () => {
    const { notifications, unreadCount, loading, markAsRead } =
        useNotifications();

    const getIcon = (note: NotificationItem) => {
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
            'App\\Notifications\\TaskAssignedNotification': (
                <UserPlus className="h-4 w-4 text-purple-500" />
            ),
            'App\\Notifications\\TicketCreatedNotification': (
                <CheckCircle className="h-4 w-4 text-blue-500" />
            ),
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

    const handleOpenNotification = async (note: NotificationItem) => {
        if (note.status === 'unread') {
            try {
                await markAsRead(note.id);
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }

        if (note.target_url) {
            router.visit(note.target_url);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {typeof unreadCount === 'number' ? (
                        <Badge variant="destructive" className="ml-2">
                            {unreadCount}
                        </Badge>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-4 max-h-96 w-80 overflow-y-auto">
                {loading ? (
                    <DropdownMenuItem className="p-3 text-sm text-muted-foreground">
                        Loading notifications...
                    </DropdownMenuItem>
                ) : null}
                {!loading && notifications.length === 0 ? (
                    <DropdownMenuItem className="p-3 text-sm text-muted-foreground">
                        No notifications yet.
                    </DropdownMenuItem>
                ) : null}
                {!loading && notifications.length > 0
                    ? notifications.map((note) => (
                          <DropdownMenuItem
                              onClick={() => void handleOpenNotification(note)}
                              key={note.id}
                              className="flex items-start space-x-3 p-3"
                          >
                              <div className="mt-0.5 shrink-0">
                                  {getIcon(note)}
                              </div>
                              <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-gray-900">
                                      {note.title}
                                  </p>
                                  {note.target_url ? (
                                      <Link
                                          href={note.target_url}
                                          className="line-clamp-2 block text-xs text-blue-600 hover:underline"
                                          onClick={(event) =>
                                              event.stopPropagation()
                                          }
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
                    <Link
                        href="/admin/notifications"
                        className="text-center text-sm text-blue-600 hover:text-blue-800"
                    >
                        View All Notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationMenu;
