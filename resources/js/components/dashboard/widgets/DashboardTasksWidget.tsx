import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { tasks as dashboardTasksRoute } from '@/routes/admin/api/dashboard';
import { type Task } from '@/types';

const completedTaskStates: Task['state'][] = ['Done', 'Cancelled', 'Rejected'];
const inProgressTaskStates: Task['state'][] = ['InProgress'];
const priorityRank: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

type DashboardTask = Partial<Task> & {
    id: number;
    title: string;
    priority?: string | null;
    status?: Task['state'];
    state?: Task['state'];
    due_at?: string | null;
    due_date?: string | null;
};

export default function DashboardTasksWidget() {
    const [tasks, setTasks] = useState<DashboardTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadTasks = useCallback(async (signal?: AbortSignal): Promise<void> => {
        setLoading(true);

        try {
            const response = await axios.request<{ tasks?: DashboardTask[] }>({
                ...dashboardTasksRoute(),
                signal,
            });

            setTasks(response.data.tasks || []);
        } catch (error) {
            if (!axios.isCancel(error)) {
                console.error(error);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
                setLoaded(true);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadAfterPageReady = () => {
            window.setTimeout(() => {
                void loadTasks(controller.signal);
            }, 0);
        };

        if (document.readyState === 'complete') {
            loadAfterPageReady();
        } else {
            window.addEventListener('load', loadAfterPageReady, { once: true });
        }

        return () => {
            controller.abort();
            window.removeEventListener('load', loadAfterPageReady);
        };
    }, [loadTasks]);

    const isOverdueTask = useCallback((task: DashboardTask): boolean => {
        const dueDateString = task.due_date ?? task.due_at;
        const status = task.status ?? task.state;
        const completed = status ? completedTaskStates.includes(status) : false;
        if (!dueDateString || completed) return false;

        const dueDate = new Date(dueDateString);
        return dueDate < new Date() && !completed;
    }, []);

    const focusTasks = useMemo(
        () => tasks
            .filter((task) => {
                const overdue = isOverdueTask(task);
                const dueDateString = task.due_date ?? task.due_at;
                const dueToday = dueDateString ? new Date(dueDateString).toDateString() === new Date().toDateString() : false;
                const status = task.status ?? task.state;
                const inProgress = status ? inProgressTaskStates.includes(status) : false;
                return overdue || dueToday || inProgress;
            })
            .sort((a, b) => {
                const aOverdue = isOverdueTask(a) ? 0 : 1;
                const bOverdue = isOverdueTask(b) ? 0 : 1;
                if (aOverdue !== bOverdue) return aOverdue - bOverdue;

                return (priorityRank[a.priority ?? ''] ?? 4) - (priorityRank[b.priority ?? ''] ?? 4);
            })
            .slice(0, 6),
        [isOverdueTask, tasks],
    );

    return (
        <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50 mb-4">
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Today's Focus
                </CardTitle>
                <CardDescription>Your agenda: overdue, due today, and active tasks.</CardDescription>
            </CardHeader>
            <CardContent>
                {focusTasks.length ? (
                    <div className="grid gap-3">
                        {focusTasks.map((task) => {
                            const overdue = isOverdueTask(task);
                            const dueDateString = task.due_date ?? task.due_at;

                            return (
                                <Link
                                    key={task.id}
                                    href={`/my/tasks/${task.id}`}
                                    className={cn(
                                        'group flex flex-col justify-center rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                                        overdue
                                            ? 'border-destructive/30 bg-destructive/[0.02] hover:border-destructive/50 hover:bg-destructive/[0.04]'
                                            : 'border-border/60 bg-card hover:border-primary/30 hover:bg-muted/50',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="font-semibold leading-none tracking-tight">{task.title}</p>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    {overdue ? (
                                                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                                    ) : (
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                    )}
                                                    <span className={overdue ? 'text-destructive font-medium' : ''}>
                                                        Due: {dueDateString
                                                            ? new Date(dueDateString).toLocaleDateString()
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <Badge variant={overdue ? 'destructive' : 'secondary'} className="capitalize shadow-sm">
                                                {task.status ?? task.state}
                                            </Badge>
                                            {task.priority && (
                                                <span className={cn(
                                                    'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full',
                                                    task.priority === 'P1' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        task.priority === 'P2' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                                )}>
                                                    {task.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[72px] animate-pulse bg-muted rounded-xl" />
                        ))}
                    </div>
                ) : loaded ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-4">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-lg">Agenda Clear!</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            You have no immediate tasks requiring attention today. Great job!
                        </p>
                    </div>
                ) : (
                    <div className="min-h-[216px]" />
                )}
            </CardContent>
        </Card>
    );
}
