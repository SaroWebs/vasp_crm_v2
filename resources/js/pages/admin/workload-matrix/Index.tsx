import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    Activity,
    BarChart3,
    Download,
    PieChart,
    RefreshCw,
} from 'lucide-react';
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
        completed: number;
        rejected: number;
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
        pending: number;
        inProgress: number;
        completed: number;
        other: number;
        estimatedHours: number;
        loggedHours: number;
        capacityHours: number;
    }>;
    taskStatusDistribution: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    utilizationData: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    workloadByDepartment: Array<{
        name: string;
        employees: number;
        totalTasks: number;
        totalEstimatedHours: number;
        totalLoggedHours: number;
        avgUtilization: number;
    }>;
    workloadTrend: Array<{
        period: string;
        utilization: number;
    }>;
}

interface MatrixPayload {
    filters: {
        period: string;
        from_date: string;
        to_date: string;
        department_id?: number | null;
        user_id?: number | null;
    };
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

interface FilterState {
    period: string;
    from_date: string;
    to_date: string;
    department_id: string;
    user_id: string;
}

interface WorkloadMatrixProps {
    matrix: MatrixPayload;
    filters: MatrixPayload['filters'];
    departments: Array<{ id: number; name: string }>;
    employees: Array<{
        id: number;
        name: string;
        department_id: number | null;
    }>;
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
    filters,
    departments,
    employees,
}: WorkloadMatrixProps) {
    const [matrix, setMatrix] = useState<MatrixPayload>(initialMatrix);
    const [loading, setLoading] = useState(false);
    const [filterState, setFilterState] = useState<FilterState>({
        period: filters.period || 'weekly',
        from_date: filters.from_date || '',
        to_date: filters.to_date || '',
        department_id: filters.department_id
            ? String(filters.department_id)
            : '',
        user_id: filters.user_id ? String(filters.user_id) : '',
    });

    const filteredEmployees = useMemo(() => {
        if (!filterState.department_id) {
            return employees;
        }

        return employees.filter(
            (employee) =>
                String(employee.department_id ?? '') ===
                filterState.department_id,
        );
    }, [employees, filterState.department_id]);

    const setFilter = (key: keyof FilterState, value: string) => {
        setFilterState((prev) => ({
            ...prev,
            [key]: value,
            ...(key === 'department_id' ? { user_id: '' } : {}),
        }));
    };

    const buildQuery = () => {
        const query: Record<string, string> = {
            period: filterState.period,
        };

        if (filterState.from_date) {
            query.from_date = filterState.from_date;
        }

        if (filterState.to_date) {
            query.to_date = filterState.to_date;
        }

        if (filterState.department_id) {
            query.department_id = filterState.department_id;
        }

        if (filterState.user_id) {
            query.user_id = filterState.user_id;
        }

        return query;
    };

    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/api/workload-matrix', {
                params: buildQuery(),
            });
            setMatrix(response.data.data);
        } catch (error) {
            console.error('Failed to load workload matrix', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = async () => {
        setFilterState({
            period: 'weekly',
            from_date: '',
            to_date: '',
            department_id: '',
            user_id: '',
        });

        setLoading(true);
        try {
            const response = await axios.get('/admin/api/workload-matrix', {
                params: { period: 'weekly' },
            });
            setMatrix(response.data.data);
        } catch (error) {
            console.error('Failed to reset workload matrix', error);
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = () => {
        const params = new URLSearchParams(buildQuery());
        window.location.href = `/admin/api/workload-matrix/export?${params.toString()}`;
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
                            Assignment load, utilization, and capacity overview
                            for admin planning
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

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Refine workload view by period, team, and employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="space-y-2">
                                <Label htmlFor="period">Period</Label>
                                <Select
                                    value={filterState.period}
                                    onValueChange={(value) =>
                                        setFilter('period', value)
                                    }
                                >
                                    <SelectTrigger id="period">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">
                                            Daily
                                        </SelectItem>
                                        <SelectItem value="weekly">
                                            Weekly
                                        </SelectItem>
                                        <SelectItem value="monthly">
                                            Monthly
                                        </SelectItem>
                                        <SelectItem value="custom">
                                            Custom
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="from-date">From Date</Label>
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={filterState.from_date}
                                    onChange={(event) =>
                                        setFilter(
                                            'from_date',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-date">To Date</Label>
                                <Input
                                    id="to-date"
                                    type="date"
                                    value={filterState.to_date}
                                    onChange={(event) =>
                                        setFilter('to_date', event.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select
                                    value={filterState.department_id || 'all'}
                                    onValueChange={(value) =>
                                        setFilter(
                                            'department_id',
                                            value === 'all' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="All departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Departments
                                        </SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem
                                                key={department.id}
                                                value={String(department.id)}
                                            >
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="employee">Employee</Label>
                                <Select
                                    value={filterState.user_id || 'all'}
                                    onValueChange={(value) =>
                                        setFilter(
                                            'user_id',
                                            value === 'all' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="employee">
                                        <SelectValue placeholder="All employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Employees
                                        </SelectItem>
                                        {filteredEmployees.map((employee) => (
                                            <SelectItem
                                                key={employee.id}
                                                value={String(employee.id)}
                                            >
                                                {employee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={fetchMatrix} disabled={loading}>
                                {loading ? 'Applying...' : 'Apply Filters'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                disabled={loading}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                            Employees
                        </div>
                        <div className="text-xl font-bold">
                            {matrix.summary.employee_count}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                            Active Tasks
                        </div>
                        <div className="text-xl font-bold">
                            {matrix.summary.total_active_tasks}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            ({matrix.summary.total_in_progress_tasks} in progress)
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">Hours</div>
                        <div className="text-xl font-bold">
                            {matrix.summary.total_open_estimated_hours}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            (Logged: {matrix.summary.total_logged_hours})
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                            Utilization
                        </div>
                        <div className="text-xl font-bold">
                            {matrix.summary.avg_planned_utilization_percent}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                            (Actual: {matrix.summary.avg_actual_utilization_percent}%)
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                {matrix.charts && matrix.rows.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Workload by Employee Bar Chart (Stacked) */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Workload Overview
                                </CardTitle>
                                <CardDescription>
                                    Pending, In Progress, Completed, and Other tasks distribution
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={500}>
                                    <BarChart
                                        data={matrix.charts.workloadByEmployee.slice(
                                            0,
                                            10,
                                        )}
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
                                            dataKey="pending"
                                            name="Pending"
                                            stackId="a"
                                            fill="#f59e0b"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            <LabelList
                                                dataKey="pending"
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
                                            stackId="a"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
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
                                        <Bar
                                            dataKey="completed"
                                            name="Completed"
                                            stackId="a"
                                            fill="#10b981"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            <LabelList
                                                dataKey="completed"
                                                position="center"
                                                fill="#fff"
                                                fontSize={11}
                                                formatter={(value) =>
                                                    value === 0 ? '' : value
                                                }
                                            />
                                        </Bar>
                                        <Bar
                                            dataKey="other"
                                            name="Other"
                                            stackId="a"
                                            fill="#6b7280"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            <LabelList
                                                dataKey="other"
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

                        {/* Task Status Distribution Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    Task Status Distribution
                                </CardTitle>
                                <CardDescription>
                                    Pending, In Progress, Completed, and Other tasks
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={
                                                matrix.charts
                                                    .taskStatusDistribution
                                            }
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) =>
                                                `${name}: ${(Number(percent || 0) * 100).toFixed(0)}%`
                                            }
                                        >
                                            {matrix.charts.taskStatusDistribution.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
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
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Utilization Comparison */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Utilization Metrics
                                </CardTitle>
                                <CardDescription>
                                    Planned vs Actual utilization
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Planned Utilization</span>
                                            <span className="font-medium">
                                                {
                                                    matrix.summary
                                                        .avg_planned_utilization_percent
                                                }
                                                %
                                            </span>
                                        </div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-violet-500 transition-all"
                                                style={{
                                                    width: `${Math.min(matrix.summary.avg_planned_utilization_percent, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Actual Utilization</span>
                                            <span className="font-medium">
                                                {
                                                    matrix.summary
                                                        .avg_actual_utilization_percent
                                                }
                                                %
                                            </span>
                                        </div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all"
                                                style={{
                                                    width: `${Math.min(matrix.summary.avg_actual_utilization_percent, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 text-center">
                                        <div className="text-3xl font-bold">
                                            {matrix.summary.total_active_tasks}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Active Tasks
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* <Card>
                    <CardHeader>
                        <CardTitle>Employee Workload</CardTitle>
                        <CardDescription>
                            Period: {matrix.filters.from_date} to{' '}
                            {matrix.filters.to_date}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>In Progress</TableHead>
                                    <TableHead>Overdue</TableHead>
                                    <TableHead>Open Est. Hours</TableHead>
                                    <TableHead>Logged Hours</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Planned %</TableHead>
                                    <TableHead>Actual %</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {matrix.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={11}
                                            className="text-center text-muted-foreground"
                                        >
                                            No records found for the selected
                                            filters.
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
                                            <TableCell>
                                                {row.open_estimated_hours}
                                            </TableCell>
                                            <TableCell>
                                                {row.logged_hours}
                                            </TableCell>
                                            <TableCell>
                                                {row.capacity_hours}
                                            </TableCell>
                                            <TableCell>
                                                {
                                                    row.planned_utilization_percent
                                                }
                                                %
                                            </TableCell>
                                            <TableCell>
                                                {row.actual_utilization_percent}
                                                %
                                            </TableCell>
                                            <TableCell>
                                                {getUtilizationBadge(
                                                    row.availability_status,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card> */}
            </div>
        </AppLayout>
    );
}
