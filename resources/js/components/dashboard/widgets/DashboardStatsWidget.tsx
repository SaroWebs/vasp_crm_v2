import { useEffect, useState } from 'react';
import axios from 'axios';
import StatCard from '@/components/dashboard/StatCard';
import { Users, FolderKanban, Clock, AlertCircle, Briefcase, Calendar, CheckCircle } from 'lucide-react';

interface DashboardStatsWidgetProps {
    dashboardType: 'admin' | 'manager' | 'employee';
}

export default function DashboardStatsWidget({ dashboardType }: DashboardStatsWidgetProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/admin/api/dashboard/stats')
            .then(res => setStats(res.data.stats))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="h-24 animate-pulse bg-muted rounded-xl w-full" />;
    }

    if (dashboardType === 'manager') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Team Members" value={stats?.total_team_members || 0} icon={Users} />
                <StatCard title="Department Tasks" value={stats?.total_department_tasks || 0} icon={FolderKanban} />
                <StatCard 
                    title="Tasks Due This Week" 
                    value={stats?.tasks_due_this_week || 0} 
                    icon={Clock} 
                    variant={stats?.tasks_due_this_week && stats.tasks_due_this_week > 0 ? 'warning' : 'default'} 
                />
                <StatCard title="Overdue Tasks" value={stats?.overdue_tasks || 0} icon={AlertCircle} variant="destructive" />
            </div>
        );
    }

    if (dashboardType === 'employee') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Due Today" 
                    value={stats?.tasks_due_today || 0} 
                    icon={Calendar} 
                    variant={stats?.tasks_due_today && stats.tasks_due_today > 0 ? 'warning' : 'default'} 
                />
                <StatCard title="Overdue" value={stats?.overdue_tasks || 0} icon={AlertCircle} variant="destructive" />
                <StatCard title="In Progress" value={stats?.in_progress_tasks || 0} icon={Clock} variant="info" />
                <StatCard title="Completed This Month" value={stats?.completed_this_month || 0} icon={CheckCircle} variant="success" />
            </div>
        );
    }

    return null;
}
