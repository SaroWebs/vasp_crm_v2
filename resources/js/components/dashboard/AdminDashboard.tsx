import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TaskTimeline from '@/components/admin/TaskTimeline';
import RecentReportSection from '@/components/reports/RecentReportSection';
import RecentTicketsWidget from '@/components/dashboard/widgets/RecentTicketsWidget';
import WizCardDesign1 from '@/components/wizards/WizCardDesign1';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { CheckCircle, Clock, TicketIcon } from 'lucide-react';
import { AttendanceList } from '../attendance/AttendanceList';
import DailyAttendancePanel from '../admin/employees/DailyAttendancePanel';

interface AdminDashboardProps {
    auth: { user?: { id?: number } } | null;
    ticketStats?: Record<string, number>;
    taskStats?: Record<string, number>;
}

export default function AdminDashboard({ auth, ticketStats, taskStats }: AdminDashboardProps) {
    const { stats: dashboardStats } = useDashboardStats(auth?.user?.id);

    const wizCards = [
        {
            title: 'Open Tickets',
            text: 'All active tickets',
            stats: dashboardStats?.open_tickets ?? 0,
            icon: TicketIcon,
            color: 'orange',
            link: '/admin/tickets?status=open',
        },
        {
            title: 'Closed Tickets',
            text: 'All closed tickets',
            stats: dashboardStats?.closed_tickets ?? 0,
            icon: CheckCircle,
            color: 'blue',
            link: '/admin/tickets?status=closed',
        },
        {
            title: 'Pending Tasks',
            text: 'All pending tasks',
            stats: dashboardStats?.pending_tasks ?? 0,
            icon: Clock,
            color: 'purple',
            link: '/admin/tasks?status=pending',
        },
        {
            title: 'Completed Tasks',
            text: 'All completed tasks',
            stats: dashboardStats?.completed_tasks ?? 0,
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
                <div className="md:col-span-8 space-y-4">
                    <RecentTicketsWidget />
                </div>
                <div className="md:col-span-8 space-y-4">
                    {/* <AttendanceList
                        date={new Date()}
                        type="admin"
                        hasPagination={true}
                        hasFilter={true}
                        showRecentOnly={false}
                    /> */}
                    <DailyAttendancePanel/>
                    <RecentReportSection />
                </div>
            </div>

            <TaskTimeline />

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
                            {Object.entries(ticketStats || {}).map(
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
                            {Object.entries(taskStats || {}).map(
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
