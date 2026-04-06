import axios from 'axios';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Link } from '@inertiajs/react';
import {
    CheckCircle2,
    Calendar,
    Users,
} from 'lucide-react';
import { format, eachDayOfInterval, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Textarea } from '../ui/textarea';

type Task = {
    id: number;
    task_code: string;
    title: string;
    description: string | null;
    state: string;
    priority: string | null;
    start_at: string | null;
    due_at: string | null;
    completed_at: string | null;
    estimate_hours: number | null;
    progress: number | null;
    created_at: string;
    task_type?: {
        id: number;
        name: string;
        code: string;
    };
    assigned_department?: {
        id: number;
        name: string;
    };
    assigned_users?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    time_entries?: Array<{
        id: number;
        start_time: string;
        end_time: string | null;
        is_active: boolean;
        user_id: number;
    }>;
    created_by?: {
        id: number;
        name: string;
    };
    sla_policy?: {
        id: number;
        name: string;
        priority: string;
    };
    ticket?: {
        id: number;
        ticket_number: string;
        title: string;
    };
    comments_count?: number;
};

type Props = {
    employees?: Employee[];
};

type Employee = {
    id: number;
    name: string;
    email?: string;
};

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'custom';

const getDateRangeForPeriod = (period: PeriodFilter): { fromDate: string; toDate: string } => {
    const today = new Date();
    
    switch (period) {
        case 'daily':
            return {
                fromDate: format(today, 'yyyy-MM-dd'),
                toDate: format(today, 'yyyy-MM-dd'),
            };
        case 'weekly':
            return {
                fromDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                toDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
            };
        case 'monthly':
            return {
                fromDate: format(startOfMonth(today), 'yyyy-MM-dd'),
                toDate: format(endOfMonth(today), 'yyyy-MM-dd'),
            };
        case 'custom':
        default:
            return {
                fromDate: '',
                toDate: '',
            };
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Done':
            return 'green';
        case 'InProgress':
            return 'lime';
        case 'Draft':
            return 'gray';
        case 'Assigned':
            return 'grape';
        case 'Blocked':
            return 'red';
        case 'InReview':
            return 'yellow';
        case 'Cancelled':
            return 'red';
        case 'Rejected':
            return 'red';
        default:
            return 'gray';
    }
};

const getStatusBgColor = (status: string) => {
    switch (status) {
        case 'Done':
            return 'bg-lime-100';
        case 'InProgress':
            return 'bg-green-100';
        case 'Draft':
            return 'bg-gray-100';
        case 'Assigned':
            return 'bg-purple-100';
        case 'Blocked':
            return 'bg-red-100';
        case 'InReview':
            return 'bg-yellow-100';
        case 'Cancelled':
            return 'bg-red-50';
        case 'Rejected':
            return 'bg-red-50';
        default:
            return 'bg-white';
    }
};

const getPriorityCheck = (priority?: string) => {
    const map = {
        P1: 'Critical',
        P2: 'High',
        P3: 'Medium',
        P4: 'Low',
    };

    if (priority) {
        return priority in map
            ? map[priority as keyof typeof map]
            : map.P4;
    } else {
        return map.P4;
    }
};

const getEffectiveEndDate = (task: Task): string | null => {
    if (task.completed_at) {
        return task.completed_at;
    }
    return task.due_at;
};

const calculateProgressFromTimeEntries = (task: Task, forDate: string): number | null => {
    if (!task.time_entries || task.time_entries.length === 0 || !task.estimate_hours) {
        return null;
    }

    const targetDate = startOfDay(parseISO(forDate));
    let totalHours = 0;
    task.time_entries.forEach(entry => {
        if (entry.end_time && !entry.is_active) {
            const entryDate = startOfDay(parseISO(entry.start_time));
            if (format(entryDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')) {
                const start = new Date(entry.start_time);
                const end = new Date(entry.end_time);
                const diffMs = end.getTime() - start.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                totalHours += diffHours;
            }
        }
    });

    if (totalHours === 0) return null;

    const progress = (totalHours / task.estimate_hours) * 100;
    return Math.min(Math.round(progress), 100);
};

const MajorTasks = ({ employees: propEmployees = [] }: Props) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodFilter>('weekly');
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [employees, setEmployees] = useState<Employee[]>(propEmployees);
    const [fromDate, setFromDate] = useState<string>(() => {
        const defaults = getDateRangeForPeriod('weekly');
        return defaults.fromDate;
    });
    const [toDate, setToDate] = useState<string>(() => {
        const defaults = getDateRangeForPeriod('weekly');
        return defaults.toDate;
    });

    // Update employees when prop changes
    useEffect(() => {
        if (propEmployees.length > 0) {
            setEmployees(propEmployees);
        }
    }, [propEmployees]);

    // Handler functions
    const handlePeriodChange = useCallback((newPeriod: PeriodFilter) => {
        setPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            const range = getDateRangeForPeriod(newPeriod);
            setFromDate(range.fromDate);
            setToDate(range.toDate);
        }
    }, []);

    const handleFromDateChange = useCallback((value: string) => {
        setFromDate(value);
        setPeriod('custom');
    }, []);

    const handleToDateChange = useCallback((value: string) => {
        setToDate(value);
        setPeriod('custom');
    }, []);

    const loadTasks = (from?: string, to?: string, employeeId?: string) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (from) params.append('from_date', from);
        if (to) params.append('to_date', to);
        if (employeeId) params.append('employee_id', employeeId);

        const queryString = params.toString();
        const url = queryString ? `/data/all/tasks?${queryString}` : '/data/all/tasks';

        axios
            .get(url)
            .then((res) => {
                setTasks(res.data.data || []);
            })
            .catch((err) => {
                console.error('Failed to load tasks:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Load employees (users for task assignment)
    const loadEmployees = () => {
        axios
            .get('/admin/data/users/assignment')
            .then((res) => {
                setEmployees(res.data.users || []);
            })
            .catch((err) => {
                console.error('Failed to load employees:', err);
            });
    };

    // Debounce timer ref
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial load
    useEffect(() => {
        loadEmployees();
        // Initial load with default values
        loadTasks(fromDate || undefined, toDate || undefined, selectedEmployee !== 'all' ? selectedEmployee : undefined);
    }, []);

    // Debounced reload when date filters or employee filter change
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            loadTasks(fromDate || undefined, toDate || undefined, selectedEmployee !== 'all' ? selectedEmployee : undefined);
        }, 500); // 500ms debounce

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [fromDate, toDate, selectedEmployee]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (
                selectedEmployee !== 'all'
                && !task.assigned_users?.some((user) => String(user.id) === selectedEmployee)
            ) {
                return false;
            }

            if (!fromDate && !toDate) return true;

            const taskStart = task.start_at ? parseISO(task.start_at) : null;
            const taskEnd = getEffectiveEndDate(task) ? parseISO(getEffectiveEndDate(task)!) : null;

            if (!taskStart && !taskEnd) return false;

            const filterStart = fromDate ? startOfDay(parseISO(fromDate)) : null;
            const filterEnd = toDate ? endOfDay(parseISO(toDate)) : null;

            if (filterStart && filterEnd) {
                if (taskStart && taskEnd) {
                    return taskStart <= filterEnd && taskEnd >= filterStart;
                } else if (taskStart) {
                    return taskStart <= filterEnd;
                } else if (taskEnd) {
                    return taskEnd >= filterStart;
                }
            } else if (filterStart) {
                if (taskEnd) {
                    return taskEnd >= filterStart;
                } else if (taskStart) {
                    return taskStart >= filterStart;
                }
            } else if (filterEnd) {
                if (taskStart) {
                    return taskStart <= filterEnd;
                } else if (taskEnd) {
                    return taskEnd <= filterEnd;
                }
            }
            return true;
        });
    }, [tasks, fromDate, toDate, selectedEmployee]);

    const timelineData = useMemo(() => {
        if (!fromDate || !toDate) {
            const allDates = new Set<string>();

            filteredTasks.forEach(task => {
                const effectiveEnd = getEffectiveEndDate(task);
                if (task.start_at && effectiveEnd) {
                    const start = startOfDay(parseISO(task.start_at));
                    const end = endOfDay(parseISO(effectiveEnd));
                    const dates = eachDayOfInterval({ start, end });
                    dates.forEach(d => allDates.add(format(d, 'yyyy-MM-dd')));
                } else if (task.start_at) {
                    allDates.add(format(parseISO(task.start_at), 'yyyy-MM-dd'));
                } else if (effectiveEnd) {
                    allDates.add(format(parseISO(effectiveEnd), 'yyyy-MM-dd'));
                } else {
                    allDates.add(format(parseISO(task.created_at), 'yyyy-MM-dd'));
                }
            });

            const grouped: Record<string, Task[]> = {};
            Array.from(allDates).sort().forEach(date => {
                grouped[date] = filteredTasks.filter(task => {
                    const taskStart = task.start_at ? startOfDay(parseISO(task.start_at)) : null;
                    const effectiveEnd = getEffectiveEndDate(task);
                    const taskEnd = effectiveEnd ? endOfDay(parseISO(effectiveEnd)) : null;
                    const taskCreated = startOfDay(parseISO(task.created_at));
                    const checkDate = startOfDay(parseISO(date));

                    if (taskStart && taskEnd) {
                        return checkDate >= taskStart && checkDate <= taskEnd;
                    } else if (taskStart && !taskEnd) {
                        // In-progress task with start_at but no end date - show from start until today
                        const today = startOfDay(new Date());
                        return checkDate >= taskStart && checkDate <= today;
                    } else if (taskEnd) {
                        return format(checkDate, 'yyyy-MM-dd') === format(taskEnd, 'yyyy-MM-dd');
                    } else {
                        return format(checkDate, 'yyyy-MM-dd') === format(taskCreated, 'yyyy-MM-dd');
                    }
                });
            });

            return grouped;
        }

        const start = startOfDay(parseISO(fromDate));
        const end = endOfDay(parseISO(toDate));
        const allDates = eachDayOfInterval({ start, end });

        const grouped: Record<string, Task[]> = {};
        allDates.forEach(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            grouped[dateKey] = filteredTasks.filter(task => {
                const taskStart = task.start_at ? startOfDay(parseISO(task.start_at)) : startOfDay(parseISO(task.created_at));
                const effectiveEnd = getEffectiveEndDate(task);
                const taskEnd = effectiveEnd ? endOfDay(parseISO(effectiveEnd)) : null;
                const taskCreated = startOfDay(parseISO(task.created_at));

                if (taskStart && taskEnd) {
                    // Task has both start and end dates - show for entire range
                    return date >= taskStart && date <= taskEnd;
                } else if (taskStart && !taskEnd) {
                    // In-progress task with start_at but no end date - show from start until today
                    const today = startOfDay(new Date());
                    return date >= taskStart && date <= today;
                } else {
                    // Fallback: show only on creation date
                    return format(date, 'yyyy-MM-dd') === format(taskCreated, 'yyyy-MM-dd');
                }
            });
        });

        return grouped;
    }, [filteredTasks, fromDate, toDate]);

    const sortedDates = useMemo(() => {
        return Object.keys(timelineData).sort((a, b) => a.localeCompare(b));
    }, [timelineData]);

    const clearFilters = () => {
        setFromDate('');
        setToDate('');
        setSelectedEmployee('all');
        setPeriod('weekly');
    };

    // Check if any non-default filters are active
    const hasActiveFilters = fromDate !== '' || toDate !== '' || (selectedEmployee !== 'all' && selectedEmployee !== '');

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between gap-2" >
                    <div className="heading" >
                        <CardTitle>Tasks Timeline </CardTitle>
                        <CardDescription>
                            Tasks view across dates
                        </CardDescription>
                    </div>
                    < div className="actions flex items-center gap-2" >
                        <CardContent className="border-b bg-muted/30" >
                            <div className="flex flex-wrap items-end gap-4" >
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Employee</label>
                                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                        <SelectTrigger className="w-[220px]">
                                            <SelectValue placeholder="All employees" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Employees</SelectItem>
                                            {employees.map((employee) => (
                                                <SelectItem key={employee.id} value={String(employee.id)}>
                                                    {employee.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Period</label>
                                    <Select value={period} onValueChange={(value) => handlePeriodChange(value as PeriodFilter)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1" >
                                    <label className="text-sm font-medium" > From Date </label>
                                    < Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => handleFromDateChange(e.target.value)}
                                        className="w-[180px]"
                                    />
                                </div>
                                < div className="flex flex-col gap-1" >
                                    <label className="text-sm font-medium" > To Date </label>
                                    < Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => handleToDateChange(e.target.value)}
                                        className="w-[180px]"
                                    />
                                </div>
                                {
                                    hasActiveFilters && (
                                        <Button variant="outline" size="sm" onClick={clearFilters} >
                                            Clear
                                        </Button>
                                    )
                                }
                            </div>
                        </CardContent>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {
                    loading ? (
                        <div className="flex items-center justify-center py-8" >
                            <div className="text-muted-foreground"> Loading tasks...</div>
                        </div>
                    ) : sortedDates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" >
                            <CheckCircle2 className="h-12 w-12 mb-2 opacity-50" />
                            <p>No tasks found </p>
                            {
                                hasActiveFilters && (
                                    <p className="text-sm mt-1" > Try adjusting your date filters </p>
                                )
                            }
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="flex gap-3 min-w-max pb-2">
                                {
                                    sortedDates.map((date) => {
                                        const dateTasks = timelineData[date];
                                        const dateObj = parseISO(date);
                                        const isToday = format(new Date(), 'yyyy-MM-dd') === date;
                                        const isPast = dateObj < startOfDay(new Date());
                                        return (
                                            <div
                                                key={date}
                                                className="flex flex-col w-56 shrink-0"
                                            >
                                                <div className={`
                                                    flex items-center justify-between gap-2 px-2 py-1.5 rounded-t-lg text-sm font-medium
                                                    ${isToday ? 'bg-primary text-primary-foreground' : ''}
                                                    ${isPast && !isToday ? 'bg-muted text-muted-foreground' : ''}
                                                    ${dateObj > new Date() ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
                                                `}>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>{format(dateObj, 'EEE, MMM dd')}</span>
                                                    </div>
                                                </div>

                                                <div className="border border-t-0 rounded-b-lg divide-y max-h-80 overflow-y-auto">
                                                    {
                                                        dateTasks.length === 0 ? (
                                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                                No tasks
                                                            </div>
                                                        ) : (
                                                            dateTasks.map((task) => {
                                                                const isCompletedDay = task.completed_at && format(date, 'yyyy-MM-dd') === format(parseISO(task.completed_at), 'yyyy-MM-dd');
                                                                return (
                                                                    <Link
                                                                        key={task.id}
                                                                        href={`/admin/tasks/${task.id}`}
                                                                        className={`block ${getStatusBgColor(task.state)}`}
                                                                    >
                                                                        <div className="flex flex-col gap-1 p-2 transition-colors hover:bg-muted/50">
                                                                            <div className="flex items-start justify-between gap-1" >
                                                                                <div className="flex items-center gap-1 min-w-0" >
                                                                                    <span className="text-[10px] font-mono text-muted-foreground truncate" >
                                                                                        {task.task_code}
                                                                                    </span>
                                                                                </div>
                                                                                {
                                                                                    (isToday || (task.state == "Done" && isCompletedDay)) && (
                                                                                        <Badge
                                                                                            color={getStatusColor(task.state)}
                                                                                            className="text-[9px] px-1.5 py-0 shrink-0"
                                                                                        >
                                                                                            {task.state}
                                                                                        </Badge>
                                                                                    )
                                                                                }
                                                                            </div>

                                                                            <div className="font-medium text-sm line-clamp-2" >
                                                                                {task.title}
                                                                            </div>
                                                                            {
                                                                                (() => {
                                                                                    const calculatedProgress = calculateProgressFromTimeEntries(task, date);
                                                                                    const progressValue = calculatedProgress !== null ? calculatedProgress : task.progress;
                                                                                    if (progressValue) {
                                                                                        return (
                                                                                            <>
                                                                                                <div className="flex items-center justify-between gap-1">
                                                                                                    <div className="flex items-center gap-0.5">
                                                                                                        {
                                                                                                            task.sla_policy?.priority && (
                                                                                                                <Badge
                                                                                                                    color={
                                                                                                                        ({
                                                                                                                            P1: 'red',
                                                                                                                            P2: 'orange',
                                                                                                                            P3: 'teal',
                                                                                                                            P4: 'cyan'
                                                                                                                        }[task.sla_policy.priority] || 'cyan')
                                                                                                                    }
                                                                                                                    className="text-[8px] px-1 py-0"
                                                                                                                >
                                                                                                                    {getPriorityCheck(task.sla_policy.priority)}
                                                                                                                </Badge>
                                                                                                            )
                                                                                                        }
                                                                                                    </div>
                                                                                                    <span className="text-[10px] text-muted-foreground">
                                                                                                        {progressValue}%
                                                                                                    </span>
                                                                                                </div>

                                                                                                {
                                                                                                    task.assigned_department && (
                                                                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                                                            <span className="flex items-center gap-0.5 truncate max-w-[100px]">
                                                                                                                <Users className="h-2.5 w-2.5 shrink-0" />
                                                                                                                < span className="truncate" > {task.assigned_department.name} </span>
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )
                                                                                                }

                                                                                                {
                                                                                                    task.assigned_users && task.assigned_users.length > 0 && (
                                                                                                        <div className="flex items-center gap-1" >
                                                                                                            <div className="flex space-x-1" >
                                                                                                                {
                                                                                                                    task.assigned_users.slice(0, 2).map((user) => (
                                                                                                                        <div
                                                                                                                            key={user.id}
                                                                                                                            className="text-[8px] font-medium flex items-center justify-center gap-2 px-2 rounded-full bg-teal-700 text-primary-foreground"
                                                                                                                            title={user.name}
                                                                                                                        >
                                                                                                                            <span>
                                                                                                                                {user.name.toUpperCase()}
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                    ))
                                                                                                                }
                                                                                                                {
                                                                                                                    task.assigned_users.length > 2 && (
                                                                                                                        <div className="h-4 w-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-medium border border-background" >
                                                                                                                            +{task.assigned_users.length - 2}
                                                                                                                        </div>
                                                                                                                    )
                                                                                                                }
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                }
                                                                                            </>
                                                                                        );
                                                                                    } else {
                                                                                        return (
                                                                                            <>
                                                                                                <div className="flex items-center gap-0.5">
                                                                                                    <span className="text-gray-300 text-xs font-semibold">Not Worked</span>
                                                                                                </div>
                                                                                                {
                                                                                                    task.assigned_users && task.assigned_users.length > 0 && (
                                                                                                        <div className="flex items-center gap-1" >
                                                                                                            <div className="flex space-x-1" >
                                                                                                                {
                                                                                                                    task.assigned_users.slice(0, 2).map((user) => (
                                                                                                                        <div
                                                                                                                            key={user.id}
                                                                                                                            className="text-[8px] font-medium flex items-center justify-center gap-2 px-2 rounded-full bg-teal-700 text-primary-foreground"
                                                                                                                            title={user.name}
                                                                                                                        >
                                                                                                                            <span>
                                                                                                                                {user.name.toUpperCase()}
                                                                                                                            </span>
                                                                                                                        </div>
                                                                                                                    ))
                                                                                                                }
                                                                                                                {
                                                                                                                    task.assigned_users.length > 2 && (
                                                                                                                        <div className="h-4 w-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-medium border border-background" >
                                                                                                                            +{task.assigned_users.length - 2}
                                                                                                                        </div>
                                                                                                                    )
                                                                                                                }
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                }
                                                                                            </>
                                                                                        );
                                                                                    }
                                                                                })()
                                                                            }

                                                                        </div>
                                                                    </Link>
                                                                )
                                                            }

                                                            )
                                                        )
                                                    }
                                                    {/* if date is not past date then  */}
                                                    <CreateTaskToEmployee
                                                        date={date}
                                                        employees={employees}
                                                        selectedEmployee={selectedEmployee}
                                                        onTaskCreated={() => loadTasks(fromDate || undefined, toDate || undefined, selectedEmployee !== 'all' ? selectedEmployee : undefined)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    )}
                <div className="mt-4 text-right" >
                    <Link href="/admin/tasks" >
                        <Button variant="outline" size="sm" >
                            View All Tasks
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};

export default MajorTasks;


const CreateTaskToEmployee = ({
    date,
    employees,
    selectedEmployee,
    onTaskCreated
}: {
    date: string;
    employees: Employee[];
    selectedEmployee: string;
    onTaskCreated: () => void;
}) => {
    const [opened, { open, close }] = useDisclosure(false);
    
    const getDefaultStartDateTime = () => {
        const selectedDate = new Date(date);
        const today = new Date();
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        
        if (isToday) {
            const now = new Date();
            const minutes = Math.round(now.getMinutes() / 15) * 15;
            now.setMinutes(minutes, 0, 0);
            return format(now, "yyyy-MM-dd'T'HH:mm");
        }
        
        // Default to 9:00 AM
        selectedDate.setHours(9, 0, 0, 0);
        return format(selectedDate, "yyyy-MM-dd'T'HH:mm");
    };

    const getDefaultDueDateTime = () => {
        const selectedDate = new Date(date);
        const today = new Date();
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        
        if (isToday) {
            // Use current time + 1 hour rounded to nearest 15 minutes
            const now = new Date();
            now.setHours(now.getHours() + 1);
            const minutes = Math.round(now.getMinutes() / 15) * 15;
            now.setMinutes(minutes, 0, 0);
            return format(now, "yyyy-MM-dd'T'HH:mm");
        }
        
        // Default to 6:00 PM
        selectedDate.setHours(18, 0, 0, 0);
        return format(selectedDate, "yyyy-MM-dd'T'HH:mm");
    };

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_at: getDefaultStartDateTime(),
        due_at: getDefaultDueDateTime(),
        employee_id: selectedEmployee || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (opened) {
            setFormData({
                title: '',
                description: '',
                start_at: getDefaultStartDateTime(),
                due_at: getDefaultDueDateTime(),
                employee_id: (selectedEmployee && selectedEmployee !== 'all') ? selectedEmployee : ''
            });
            setError('');
        }
    }, [opened, date, selectedEmployee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate required fields
        if (!formData.title.trim()) {
            setError('Task title is required');
            return;
        }

        if (!formData.employee_id) {
            setError('Please select an employee');
            return;
        }

        if (!formData.due_at) {
            setError('Due date is required');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create the task
            const taskResponse = await axios.post('/admin/tasks', {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                start_at: formData.start_at || null,
                due_at: formData.due_at,
                state: 'Assigned'
            });

            const taskId = taskResponse.data.task?.id || taskResponse.data.id;

            if (taskId && formData.employee_id) {
                // Assign the employee to the task
                await axios.post(`/admin/tasks/${taskId}/assign`, {
                    user_id: Number(formData.employee_id)
                });
            }

            close();
            onTaskCreated();
        } catch (err: unknown) {
            console.error('Failed to create task:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to create task. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPastDate = startOfDay(parseISO(date)) < startOfDay(new Date());

    if (isPastDate) {
        return null;
    }

    return (
        <>
            <Card
                onClick={open}
                className='w-full min-h-[50px] justify-center items-center cursor-pointer hover:bg-muted/50 transition-colors'
            >
                <div className='flex items-center justify-center text-muted-foreground text-sm'>
                    + Create Task
                </div>
            </Card>
            <Modal
                opened={opened}
                onClose={close}
                title="Create Task"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter task title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter task description (optional)"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date & Time</label>
                            <Input
                                type="datetime-local"
                                value={formData.start_at}
                                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date & Time *</label>
                            <Input
                                type="datetime-local"
                                value={formData.due_at}
                                onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                                min={formData.start_at}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Assign To *</label>
                        <select
                            value={formData.employee_id}
                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                        >
                            <option value="">Select an employee...</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id.toString()}>
                                    {employee.name}
                                </option>
                            ))}
                        </select>
                        {selectedEmployee && (
                            <p className="text-xs text-muted-foreground">
                                Pre-selected from filter: {employees.find(e => e.id.toString() === selectedEmployee)?.name}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={close}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};
