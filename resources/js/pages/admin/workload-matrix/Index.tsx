import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface MatrixRow {
    employee_id: number;
    user_id: number;
    name: string;
    email: string;
    department: {
        id: number | null;
        name: string | null;
    };
    active_task_count: number;
    in_progress_task_count: number;
    pending_task_count: number;
    overdue_task_count: number;
    assignment_state_counts: {
        pending: number;
        accepted: number;
        in_progress: number;
    };
    open_estimated_hours: number;
    logged_hours: number;
    capacity_hours: number;
    planned_utilization_percent: number;
    actual_utilization_percent: number;
    worked_task_count_in_period: number;
    availability_status: 'available' | 'balanced' | 'overloaded';
}

interface ChartData {
    workloadByEmployee: Array<{
        name: string;
        fullName: string;
        userId: number;
        assigned: number;
        inProgress: number;
        estimatedHours: number;
        loggedHours: number;
        capacityHours: number;
    }>;
}

interface MatrixPayload {
    summary: {
        employee_count: number;
        total_active_tasks: number;
        total_in_progress_tasks: number;
        total_overdue_tasks: number;
        total_open_estimated_hours: number;
        total_logged_hours: number;
        total_capacity_hours: number;
        avg_planned_utilization_percent: number;
        avg_actual_utilization_percent: number;
    };
    rows: MatrixRow[];
    charts?: ChartData;
    generated_at: string;
}

interface WorkloadMatrixProps {
    matrix: MatrixPayload;
    departments: Array<{ id: number; name: string }>;
    employees: Array<{
        id: number;
        name: string;
        department_id: number | null;
    }>;
}

type TaskSegment = 'pending' | 'in_progress';

interface WorkloadTask {
    id: number;
    task_code: string;
    title: string;
    state: string;
    due_at: string | null;
    start_at: string | null;
    estimate_hours: number | null;
    assigned_department_id: number | null;
    assigned_department?: {
        id: number;
        name: string;
    } | null;
    active_time_entry?: {
        id: number;
        start_time: string;
        duration_seconds: number;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Workload Matrix',
        href: '/admin/workload-matrix',
    },
];

export default function WorkloadMatrixIndex({
    matrix: initialMatrix,
    departments,
    employees,
}: WorkloadMatrixProps) {
    const [matrix, setMatrix] = useState<MatrixPayload>(initialMatrix);
    const [loading, setLoading] = useState(false);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalLoading, setTaskModalLoading] = useState(false);
    const [taskModalError, setTaskModalError] = useState<string | null>(null);
    const [taskModalTasks, setTaskModalTasks] = useState<WorkloadTask[]>([]);
    const [taskModalTotal, setTaskModalTotal] = useState(0);
    const [taskModalSegment, setTaskModalSegment] =
        useState<TaskSegment | null>(null);
    const [taskModalEmployee, setTaskModalEmployee] = useState<{
        userId: number;
        name: string;
    } | null>(null);

    const fetchMatrix = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await fetch('/admin/api/workload-matrix');
            const result = await response.json();
            setMatrix(result.data);
        } catch (error) {
            console.error('Failed to load workload matrix', error);
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = (): void => {
        window.location.href = '/admin/api/workload-matrix/export';
    };

    const stackedWorkloadData = useMemo(
        () =>
            (matrix.charts?.workloadByEmployee ?? []).map((employee) => ({
                ...employee,
                assignedQueue: Math.max(
                    employee.assigned - employee.inProgress,
                    0,
                ),
            })),
        [matrix.charts],
    );

    const donutChartData = useMemo(
        () =>
            [
                {
                    name: 'Pending',
                    value: Math.max(
                        matrix.summary.total_active_tasks -
                        matrix.summary.total_in_progress_tasks,
                        0,
                    ),
                    color: '#f59e0b',
                },
                {
                    name: 'In Progress',
                    value: matrix.summary.total_in_progress_tasks,
                    color: '#3b82f6',
                },
            ].filter((segment) => segment.value > 0),
        [
            matrix.summary.total_active_tasks,
            matrix.summary.total_in_progress_tasks,
        ],
    );

    const formatDuration = (seconds: number): string => {
        if (!Number.isFinite(seconds) || seconds <= 0) {
            return '0m';
        }

        const totalMinutes = Math.floor(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours <= 0) {
            return `${minutes}m`;
        }

        return `${hours}h ${minutes}m`;
    };

    const closeTaskModal = (open: boolean): void => {
        setTaskModalOpen(open);
        if (!open) {
            setTaskModalTasks([]);
            setTaskModalTotal(0);
            setTaskModalError(null);
            setTaskModalSegment(null);
            setTaskModalEmployee(null);
        }
    };

    const openTaskModal = async (
        segment: TaskSegment,
        payload: {
            userId?: number;
            fullName?: string;
            name?: string;
            assignedQueue?: number;
            inProgress?: number;
        },
    ): Promise<void> => {
        if (!payload?.userId) {
            return;
        }

        const segmentCount =
            segment === 'pending'
                ? payload.assignedQueue ?? 0
                : payload.inProgress ?? 0;

        if (segmentCount <= 0) {
            return;
        }

        setTaskModalOpen(true);
        setTaskModalLoading(true);
        setTaskModalError(null);
        setTaskModalTasks([]);
        setTaskModalTotal(0);
        setTaskModalSegment(segment);
        setTaskModalEmployee({
            userId: payload.userId,
            name: payload.fullName ?? payload.name ?? 'Employee',
        });

        try {
            const response = await fetch(
                `/admin/api/workload-matrix/tasks?user_id=${payload.userId}&segment=${segment}`,
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result?.message ??
                    'Unable to load tasks for this workload segment.',
                );
            }

            const tasksPayload = result?.tasks;
            setTaskModalTasks(tasksPayload?.data ?? []);
            setTaskModalTotal(
                tasksPayload?.total ?? tasksPayload?.data?.length ?? 0,
            );
        } catch (error) {
            console.error('Failed to load workload tasks', error);
            setTaskModalError(
                'Unable to load tasks for this workload segment.',
            );
        } finally {
            setTaskModalLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Workload Matrix" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Workload Matrix
                        </h1>
                        <p className="text-muted-foreground">
                            Current task assignments for each team member
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={fetchMatrix}
                            disabled={loading}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={exportCsv}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl">
                                {matrix.summary.employee_count}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Employees
                            </p>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl">
                                {matrix.summary.total_active_tasks}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Assigned Tasks
                            </p>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl">
                                {matrix.summary.total_in_progress_tasks}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                In Progress
                            </p>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl">
                                {matrix.summary.total_overdue_tasks}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Overdue
                            </p>
                        </CardHeader>
                    </Card>
                </div>

                {matrix.charts && matrix.rows.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Workload Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={500}>
                                    <BarChart
                                        data={stackedWorkloadData.slice(0, 10)}
                                        layout="vertical"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-muted"
                                        />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 12 }}
                                            width={100}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="assignedQueue"
                                            name="Pending"
                                            stackId="assigned"
                                            fill="#f59e0b"
                                            radius={[0, 0, 0, 0]}
                                            cursor="pointer"
                                            onClick={(data) =>
                                                openTaskModal(
                                                    'pending',
                                                    data?.payload ?? {},
                                                )
                                            }
                                        >
                                            <LabelList
                                                dataKey="assignedQueue"
                                                position="center"
                                                fill="#fff"
                                                fontSize={11}
                                                formatter={(value) =>
                                                    value === 0 ? '' : value
                                                }
                                            />
                                        </Bar>
                                        <Bar
                                            dataKey="inProgress"
                                            name="In Progress"
                                            stackId="assigned"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
                                            cursor="pointer"
                                            onClick={(data) =>
                                                openTaskModal(
                                                    'in_progress',
                                                    data?.payload ?? {},
                                                )
                                            }
                                        >
                                            <LabelList
                                                dataKey="inProgress"
                                                position="center"
                                                fill="#fff"
                                                fontSize={11}
                                                formatter={(value) =>
                                                    value === 0 ? '' : value
                                                }
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Assignment Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={320}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={donutChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }) =>
                                                `${name}: ${(Number(percent || 0) * 100).toFixed(0)}%`
                                            }
                                        >
                                            {donutChartData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`${entry.name}-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ),
                                            )}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                <Card className="hidden">
                    <CardHeader>
                        <CardTitle>Employee Workload</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Assigned</TableHead>
                                    <TableHead>In Progress</TableHead>
                                    <TableHead>Overdue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {matrix.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-muted-foreground"
                                        >
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    matrix.rows.map((row) => (
                                        <TableRow key={row.user_id}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {row.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {row.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {row.department.name ||
                                                    'Unassigned'}
                                            </TableCell>
                                            <TableCell>
                                                {row.active_task_count}
                                            </TableCell>
                                            <TableCell>
                                                {row.in_progress_task_count}
                                            </TableCell>
                                            <TableCell>
                                                {row.overdue_task_count}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={taskModalOpen} onOpenChange={closeTaskModal}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {taskModalSegment === 'pending'
                                ? 'Pending Tasks'
                                : taskModalSegment === 'in_progress'
                                    ? 'In Progress Tasks'
                                    : 'Tasks'}
                        </DialogTitle>
                        <DialogDescription>
                            {taskModalEmployee?.name
                                ? `${taskModalEmployee.name} - ${taskModalTotal} tasks`
                                : 'Task details'}
                        </DialogDescription>
                    </DialogHeader>

                    {taskModalLoading ? (
                        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading tasks...
                        </div>
                    ) : taskModalError ? (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {taskModalError}
                        </div>
                    ) : taskModalTasks.length === 0 ? (
                        <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                            No tasks found for this segment.
                        </div>
                    ) : (
                        <div className="max-h-[420px] overflow-y-auto rounded-md border">
                            <div className="divide-y">
                                {taskModalTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold">
                                                {task.task_code}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {task.title}
                                            </div>
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-muted-foreground">
                                                    Start Date:{' '}
                                                    {task.start_at
                                                        ? new Date(
                                                            task.start_at,
                                                        ).toLocaleDateString()
                                                        : 'Not set'}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Due:{' '}
                                                    {task.due_at
                                                        ? new Date(
                                                            task.due_at,
                                                        ).toLocaleDateString()
                                                        : 'Not set'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            {task.active_time_entry ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                                                    Working{' '}
                                                    {formatDuration(
                                                        task.active_time_entry
                                                            .duration_seconds,
                                                    )}
                                                </Badge>
                                            ) : null}
                                            <Badge variant="outline">
                                                {task.state}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
