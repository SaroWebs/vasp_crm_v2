import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TimeSpentBarChart from '@/components/dashboard/TimeSpentBarChart';
import { Link } from '@inertiajs/react';
import { BarChart3, Activity, Clock, PlusCircle, CheckCircle, UserPlus, ArrowRight, MessageSquare, RefreshCcw, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case 'Clock': return <Clock className="h-4 w-4 text-emerald-600" />;
        case 'LogOut': return <LogOut className="h-4 w-4 text-orange-600" />;
        case 'PlusCircle': return <PlusCircle className="h-4 w-4 text-blue-600" />;
        case 'CheckCircle': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
        case 'UserPlus': return <UserPlus className="h-4 w-4 text-purple-600" />;
        case 'ArrowRight': return <ArrowRight className="h-4 w-4 text-blue-600" />;
        case 'MessageSquare': return <MessageSquare className="h-4 w-4 text-indigo-600" />;
        case 'RefreshCcw': return <RefreshCcw className="h-4 w-4 text-amber-600" />;
        default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
};

const getIconBg = (iconName: string) => {
    switch (iconName) {
        case 'Clock': return 'bg-emerald-100 dark:bg-emerald-900/30';
        case 'LogOut': return 'bg-orange-100 dark:bg-orange-900/30';
        case 'PlusCircle': return 'bg-blue-100 dark:bg-blue-900/30';
        case 'CheckCircle': return 'bg-emerald-100 dark:bg-emerald-900/30';
        case 'UserPlus': return 'bg-purple-100 dark:bg-purple-900/30';
        case 'ArrowRight': return 'bg-blue-100 dark:bg-blue-900/30';
        case 'MessageSquare': return 'bg-indigo-100 dark:bg-indigo-900/30';
        case 'RefreshCcw': return 'bg-amber-100 dark:bg-amber-900/30';
        default: return 'bg-muted';
    }
};

export default function EmployeeActivitiesWidget() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/admin/api/dashboard/activities')
            .then(res => {
                setActivities(res.data.activities || []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <Card className="shadow-sm border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Daily Time Spent
                        </CardTitle>
                        <CardDescription>Loading chart data...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] animate-pulse bg-muted rounded-xl" />
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Employee Activities
                        </CardTitle>
                        <CardDescription>Loading activities...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 animate-pulse bg-muted rounded-xl" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="shadow-sm border-border/50 transition-all hover:shadow-md">
                <CardHeader className="pb-3 border-b border-border/50 mb-4">
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Daily Time Spent
                    </CardTitle>
                    <CardDescription>Track your daily time spent over the last week or month.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="pt-2">
                        <TimeSpentBarChart />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50 transition-all hover:shadow-md">
                <CardHeader className="pb-3 border-b border-border/50 mb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Employee Activities
                    </CardTitle>
                    <CardDescription>Recent time entries and activity history for your work.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {activities.length ? (
                            activities.map((activity) => {
                                const ActivityContent = (
                                    <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                        <div className={cn("p-2 rounded-full shrink-0", getIconBg(activity.icon))}>
                                            {getIconComponent(activity.icon)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                                            <p className="text-[10px] text-muted-foreground/80 font-medium">
                                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                );

                                if (activity.link) {
                                    return (
                                        <Link key={activity.id} href={activity.link} className="block group">
                                            {ActivityContent}
                                        </Link>
                                    );
                                }

                                return <div key={activity.id}>{ActivityContent}</div>;
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                                <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                <p className="text-sm font-medium">No recent activity</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Time entries and updates will appear here.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
