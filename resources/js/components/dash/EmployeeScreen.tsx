import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Auth, Task } from "@/types";
import WizCardDesign1 from "../wizards/WizCardDesign1";
import { AlertCircle, Calendar, CheckCircle, Clock } from "lucide-react";
import { AttendanceCalendar } from "../attendance";
import DashboardTasksWidget from "../dashboard/widgets/DashboardTasksWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui";
import Board from "../tasks/Board";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

interface EmployeeScreenProps {
    auth?: Auth | null;
}
const EmployeeScreen = ({ auth }: EmployeeScreenProps) => {
    const { stats } = useDashboardStats(auth?.user?.id);
    const [boardTasks, setBoardTasks] = useState<Task[]>([]);
    const [boardLoading, setBoardLoading] = useState(false);
    const [boardError, setBoardError] = useState<string | null>(null);

    const wizData = [
        {
            title: "Due Today",
            text: "",
            stats: Number(stats?.tasks_due_today || 0),
            icon: Calendar,
            color: 'orange',
            link: '/my/tasks?filter=pending&due=today'
        },
        {
            title: "Overdue",
            text: "",
            stats: Number(stats?.overdue_tasks || 0),
            icon: AlertCircle,
            color: 'red',
            link: '/my/tasks?filter=pending'
        },
        {
            title: "In Progress",
            text: "",
            stats: Number(stats?.in_progress_tasks || 0),
            icon: Clock,
            color: 'blue',
            link: '/my/tasks?filter=in_progress'
        },
        {
            title: "Completed This Month",
            text: "",
            stats: Number(stats?.completed_this_month || 0),
            icon: CheckCircle,
            color: 'green',
            link: '/my/tasks?filter=done'
        }
    ] as const;


    const loadBoardTasks = useCallback(async (): Promise<void> => {
        if (!auth?.user?.id) {
            setBoardTasks([]);
            return;
        }

        setBoardLoading(true);
        setBoardError(null);

        try {
            const response = await axios.get('/admin/data/tasks', {
                params: {
                    assigned_to: auth.user.id,
                    per_page: 100,
                    sort_by: 'due_at',
                    sort_order: 'asc',
                },
            });

            const taskData = response.data.tasks?.data ?? response.data.tasks ?? [];
            setBoardTasks(Array.isArray(taskData) ? taskData : []);
        } catch {
            setBoardError('Unable to load your task board.');
        } finally {
            setBoardLoading(false);
        }
    }, [auth?.user?.id]);

    useEffect(() => {
        const loadAfterPageReady = () => {
            window.setTimeout(() => {
                void loadBoardTasks();
            }, 0);
        };

        if (document.readyState === 'complete') {
            loadAfterPageReady();
        } else {
            window.addEventListener('load', loadAfterPageReady, { once: true });
        }

        return () => window.removeEventListener('load', loadAfterPageReady);
    }, [loadBoardTasks]);
    
    return (
        <div className="">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {wizData.map((card, index) => (
                    <WizCardDesign1
                        key={index}
                        title={card.title}
                        text={card.text}
                        stats={card.stats}
                        icon={card.icon}
                        color={card.color}
                        link={card.link}
                    />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                <DashboardTasksWidget />
                <AttendanceCalendar auth={auth} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Task Board</CardTitle>
                    <CardDescription>
                        Drag tasks between statuses and keep your work flowing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {boardError ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {boardError}
                        </div>
                    ) : (
                        <Board tasks={boardTasks} loadTasks={loadBoardTasks} isLoading={boardLoading} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default EmployeeScreen;
