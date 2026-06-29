import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TaskTimeline from '@/components/admin/TaskTimeline';
import RecentReportSection from '@/components/reports/RecentReportSection';
import RecentTicketsWidget from '@/components/dashboard/widgets/RecentTicketsWidget';
import WizCardDesign1 from '@/components/wizards/WizCardDesign1';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { CheckCircle, Clock, TicketIcon } from 'lucide-react';
import DailyAttendancePanel from '../admin/employees/DailyAttendancePanel';
import { Auth } from '@/types';
import { useEffect, useState } from 'react';

interface AdminDashboardProps {
    auth: Auth | null;
}

export default function AdminDashboard({ auth }: AdminDashboardProps) {
    const { stats: dashboardStats } = useDashboardStats(auth?.user?.id);
    const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setShowSecondaryWidgets(true);
        }, 700);

        return () => window.clearTimeout(timeoutId);
    }, []);

    const statNumber = (key: string): number => {
        const value = dashboardStats[key];

        return typeof value === 'number' ? value : 0;
    };
    const statDistribution = (key: string): Record<string, number> | undefined => {
        const value = dashboardStats[key];

        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : undefined;
    };
    const ticketStatusDistribution = statDistribution('ticket_status_distribution') ?? {};
    const taskStatusDistribution = statDistribution('task_status_distribution') ?? {};

    const wizCards = [
        {
            title: 'Open Tickets',
            text: 'All active tickets',
            stats: statNumber('open_tickets'),
            icon: TicketIcon,
            color: 'orange',
            link: '/admin/tickets?status=open',
        },
        {
            title: 'Closed Today',
            text: 'Tickets closed today',
            stats: statNumber('tickets_closed_today'),
            icon: CheckCircle,
            color: 'blue',
            link: '/admin/tickets?status=closed',
        },
        {
            title: 'Pending Tasks',
            text: 'All pending tasks',
            stats: statNumber('pending_tasks'),
            icon: Clock,
            color: 'purple',
            link: '/admin/tasks?status=pending',
        },
        {
            title: 'Completed Today',
            text: 'Tasks completed today',
            stats: statNumber('tasks_completed_today'),
            icon: CheckCircle,
            color: 'green',
            link: '/admin/tasks?status=completed',
        },
    ] as const;

    return (
        <>
            <div className="grid gap-4 md:grid-cols-8">
                <div className="md:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {wizCards.map((wizCard) => (
                            <WizCardDesign1
                                key={wizCard.title}
                                title={wizCard.title}
                                text={wizCard.text}
                                stats={wizCard.stats}
                                icon={wizCard.icon}
                                color={wizCard.color}
                                link={wizCard.link}
                            />
                        ))}
                    </div>
                </div>
                {showSecondaryWidgets && (
                    <>
                        <div className="md:col-span-8 space-y-4">
                            <RecentTicketsWidget />
                        </div>
                        <div className="md:col-span-8 space-y-4">
                            <DailyAttendancePanel />
                            <RecentReportSection />
                        </div>
                    </>
                )}
            </div>

            {showSecondaryWidgets && <TaskTimeline />}

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Status Distribution</CardTitle>
                        <CardDescription>
                            Current status of all tickets
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(ticketStatusDistribution).map(
                                ([status, count]) => (
                                    <div
                                        key={status}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="capitalize">
                                            {status.replace('_', ' ')}
                                        </span>
                                        <Badge variant="outline">{count}</Badge>
                                    </div>
                                ),
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Task Status Distribution</CardTitle>
                        <CardDescription>
                            Current status of all tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(taskStatusDistribution).map(
                                ([status, count]) => (
                                    <div
                                        key={status}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="capitalize">
                                            {status.replace('_', ' ')}
                                        </span>
                                        <Badge variant="outline">{count}</Badge>
                                    </div>
                                ),
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
