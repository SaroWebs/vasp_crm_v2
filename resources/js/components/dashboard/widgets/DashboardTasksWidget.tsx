import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, AlertCircle, CalendarDays, CheckCircle2, Eye, Forward, MessageSquare, History, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Menu, MenuTarget, MenuDropdown, MenuItem } from '@mantine/core';
import { Link } from '@inertiajs/react';
import TaskForwarding from '@/components/tasks/TaskForwarding';
import TaskHistories from '@/components/tasks/TaskHistories';
import TaskComments from '@/components/tasks/task-comments';

interface TaskActionModalsProps {
    task: any;
    openedModal: 'forwarding' | 'comments' | 'histories' | null;
    onClose: () => void;
}

const TaskActionModals = ({ task, openedModal, onClose }: TaskActionModalsProps) => {
    return (
        <>
            <Modal
                opened={openedModal === 'forwarding'}
                onClose={onClose}
                size={'lg'}
                title="Forward Task"
            >
                {task ? <TaskForwarding task={task} /> : null}
            </Modal>

            <Modal
                opened={openedModal === 'comments'}
                onClose={onClose}
                size={'lg'}
                title="Task Comments"
            >
                {task ? <TaskComments taskId={task.id} /> : null}
            </Modal>

            <Modal
                opened={openedModal === 'histories'}
                onClose={onClose}
                size={'lg'}
                title="Task History"
            >
                {task ? <TaskHistories task={task} /> : null}
            </Modal>
        </>
    );
};

export default function DashboardTasksWidget() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<any>(null);
    const [openedModal, setOpenedModal] = useState<'forwarding' | 'comments' | 'histories' | null>(null);

    useEffect(() => {
        axios.get('/admin/api/dashboard/tasks')
            .then(res => setTasks(res.data.tasks || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const isOverdueTask = (task: any): boolean => {
        const dueDateString = task.due_date ?? task.due_at;
        const completed = ['Done', 'Cancelled', 'Rejected'].includes(task.status ?? task.state);
        if (!dueDateString || completed) return false;

        const dueDate = new Date(dueDateString);
        return dueDate < new Date() && !completed;
    };

    const focusTasks = tasks
        .filter((task) => {
            const overdue = isOverdueTask(task);
            const dueDateString = task.due_date ?? task.due_at;
            const dueToday = dueDateString ? new Date(dueDateString).toDateString() === new Date().toDateString() : false;
            const inProgress = ['InProgress'].includes(task.status ?? task.state);
            return overdue || dueToday || inProgress;
        })
        .sort((a, b) => {
            const aOverdue = isOverdueTask(a) ? 0 : 1;
            const bOverdue = isOverdueTask(b) ? 0 : 1;
            if (aOverdue !== bOverdue) return aOverdue - bOverdue;

            const priorityRank: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
            return (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4);
        })
        .slice(0, 6);

    const handleMenuAction = (task: any, action: 'forwarding' | 'comments' | 'histories') => {
        setActiveTask(task);
        setOpenedModal(action);
    };

    if (loading) {
        return (
            <Card className="shadow-sm border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Today's Focus
                    </CardTitle>
                    <CardDescription>Loading your agenda...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[72px] animate-pulse bg-muted rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
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
                            {focusTasks.map((task, i) => {
                                const overdue = isOverdueTask(task);
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "group flex flex-col justify-center rounded-xl border p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative",
                                            overdue
                                                ? 'border-destructive/30 bg-destructive/[0.02] hover:border-destructive/50 hover:bg-destructive/[0.04]'
                                                : 'border-border/60 bg-card hover:border-primary/30 hover:bg-muted/50'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4 pr-8">
                                            <Menu>
                                                <MenuTarget>
                                                    <div className="space-y-1 cursor-pointer">
                                                        <p className="font-semibold leading-none tracking-tight">{task.title}</p>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                                                            <div className="flex items-center gap-1.5">
                                                                {overdue ? (
                                                                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                                                ) : (
                                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                                )}
                                                                <span className={overdue ? "text-destructive font-medium" : ""}>
                                                                    Due: {(task.due_date ?? task.due_at)
                                                                        ? new Date(task.due_date ?? task.due_at).toLocaleDateString()
                                                                        : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </MenuTarget>
                                                <MenuDropdown>
                                                    {task ? (
                                                        <MenuItem
                                                            leftSection={<Eye size={14} />}
                                                            component={Link}
                                                            href={`/my/tasks/${task.id}`}
                                                        >
                                                            View
                                                        </MenuItem>
                                                    ) : null}
                                                    <MenuItem
                                                        leftSection={<Forward size={14} />}
                                                        onClick={() => handleMenuAction(task, 'forwarding')}
                                                    >
                                                        Forward
                                                    </MenuItem>
                                                    <MenuItem
                                                        leftSection={<MessageSquare size={14} />}
                                                        onClick={() => handleMenuAction(task, 'comments')}
                                                    >
                                                        Comments
                                                    </MenuItem>
                                                    <MenuItem
                                                        leftSection={<History size={14} />}
                                                        onClick={() => handleMenuAction(task, 'histories')}
                                                    >
                                                        Histories
                                                    </MenuItem>
                                                </MenuDropdown>
                                            </Menu>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <Badge variant={overdue ? 'destructive' : 'secondary'} className="capitalize shadow-sm">
                                                    {task.status ?? task.state}
                                                </Badge>
                                                {task.priority && (
                                                    <span className={cn(
                                                        "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                                                        task.priority === 'P1' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                            task.priority === 'P2' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-4">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-lg">Agenda Clear!</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                You have no immediate tasks requiring attention today. Great job!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TaskActionModals
                task={activeTask}
                openedModal={openedModal}
                onClose={() => setOpenedModal(null)}
            />
        </>
    );
}
