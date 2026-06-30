import StatCard from '@/components/dashboard/StatCard';
import { Users, FolderKanban, Clock, AlertCircle, Calendar, CheckCircle } from 'lucide-react';
import WizCardDesign1 from '@/components/wizards/WizCardDesign1';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

interface DashboardStatsWidgetProps {
    dashboardType: 'admin' | 'manager' | 'employee';
    userId?: number | string | null;
}

export default function DashboardStatsWidget({ dashboardType, userId }: DashboardStatsWidgetProps) {
    const { stats, loading } = useDashboardStats(userId);

    if (loading) {
        return <div className="h-24 animate-pulse bg-muted rounded-xl w-full" />;
    }

    if (dashboardType === 'manager') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Team Members" value={String(stats?.total_team_members || 0)} icon={Users} />
                <StatCard title="Department Tasks" value={String(stats?.total_department_tasks || 0)} icon={FolderKanban} />
                <StatCard
                    title="Tasks Due This Week"
                    value={String(stats?.tasks_due_this_week || 0)}
                    icon={Clock}
                    variant={stats?.tasks_due_this_week && Number(stats.tasks_due_this_week) > 0 ? 'warning' : 'default'}
                />
                <StatCard title="Overdue Tasks" value={String(stats?.overdue_tasks || 0)} icon={AlertCircle} variant="destructive" />
            </div>
        );
    }

    if (dashboardType === 'employee') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <WizCardDesign1
                    title={"Due Today"}
                    text={""}
                    stats={Number(stats?.tasks_due_today || 0)}
                    icon={Calendar}
                    color={'orange'}
                    link={'/my/tasks?filter=pending&due=today'}
                />
                <WizCardDesign1
                   title={"Overdue"}
                    text={""}
                    stats={Number(stats?.overdue_tasks || 0)}
                    icon={AlertCircle}
                    color={'red'}
                    link={'/my/tasks?filter=pending'}
                />

                <WizCardDesign1
                    title={"In Progress"}
                    text={""}
                    stats={Number(stats?.in_progress_tasks || 0)}
                    icon={Clock}
                    color={'blue'}
                    link={'/my/tasks?filter=in_progress'}
                />
                <WizCardDesign1
                    title={"Completed This Month"}
                    text={""}
                    stats={Number(stats?.completed_this_month || 0)}
                    icon={CheckCircle}
                    color={'green'}
                    link={'/my/tasks?filter=done'}
                />
            </div>
        );
    }

    return null;
}
