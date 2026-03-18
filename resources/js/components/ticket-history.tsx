import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, User, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TicketHistoryItem {
    id: number;
    ticket_id: number;
    old_status: string;
    new_status: string;
    changed_by: {
        id: number;
        name: string;
        email: string;
        avatar?:string;
    } | null;
    created_at: string;
    updated_at: string;
}

interface TicketHistoryProps {
    ticketId: number;
}

const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, any> = {
        'open': Clock,
        'approved': CheckCircle,
        'in-progress': Activity,
        'completed': CheckCircle,
        'cancelled': XCircle,
        'closed': CheckCircle,
        'rejected': XCircle,
        'assigned': User
    };

    return statusIcons[status.toLowerCase()] || Activity;
};

const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
        'open': 'text-blue-500',
        'approved': 'text-green-500',
        'in-progress': 'text-yellow-500',
        'completed': 'text-green-600',
        'cancelled': 'text-red-500',
        'closed': 'text-gray-500',
        'rejected': 'text-red-600',
        'assigned': 'text-purple-500'
    };

    return statusColors[status.toLowerCase()] || 'text-gray-500';
};

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

export default function TicketHistory({ ticketId }: TicketHistoryProps) {
    const [history, setHistory] = useState<TicketHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTicketHistory = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/admin/tickets/${ticketId}/history`);
                setHistory(response.data.history || []);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch ticket history:', err);
                setError('Failed to load ticket history');
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketHistory();
    }, [ticketId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span>Ticket History</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span>Ticket History</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-red-500">
                        {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span>Ticket History</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-gray-500">
                        No history available for this ticket
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Ticket History</span>
                    <Badge variant="outline" className="ml-2">
                        {history.length} {history.length === 1 ? 'event' : 'events'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {history.map((item) => {
                        const Icon = getStatusIcon(item.new_status);
                        const statusColor = getStatusColor(item.new_status);

                        return (
                            <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="shrink-0">
                                    <div className={`p-2 rounded-full ${statusColor} bg-gray-100`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-sm">
                                            {item.new_status.replace(/-/g, ' ')}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {formatDateTime(item.created_at)}
                                        </span>
                                    </div>

                                    {item.changed_by && (
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={item.changed_by?.avatar || undefined} />
                                                <AvatarFallback>{getInitials(item.changed_by.name)}</AvatarFallback>
                                            </Avatar>
                                            <span>Changed by {item.changed_by.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}