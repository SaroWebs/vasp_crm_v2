import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { format } from 'date-fns';
import {
    ArrowLeft,
    UserIcon,
    Clock,
    FileText,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';

interface EmployeeProgressProps {
    progressData: {
        success: boolean;
        data: Array<{
            user_id: number;
            user_name: string;
            email: string;
            total_time: number;
            tasks_completed: number;
            task_details: Array<number>;
            daily_reports: Record<string, {
                date: string;
                total_time: number;
                tasks_completed: number;
                events: Array<{
                    event_type: string;
                    event_name: string;
                    event_description: string;
                }>;
            }>;
        }>;
        total_employees: number;
        total_time: number;
        total_tasks: number;
        period: string;
    };
    filterOptions: {
        date?: string;
        from_date?: string;
        to_date?: string;
    };
}

const breadcrumbs = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Employee Progress',
        href: '#',
    },
];

export default function EmployeeProgress({ progressData, filterOptions }: EmployeeProgressProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('daily');
    const [dateRange, setDateRange] = useState({
        from_date: filterOptions.from_date || '',
        to_date: filterOptions.to_date || '',
    });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEmployeeProgress = () => {
        setIsLoading(true);
        axios.get('/admin/employee-progress', {
            params: {
                period: selectedPeriod,
                from_date: dateRange.from_date,
                to_date: dateRange.to_date,
            },
        })
            .then((response) => {
                console.log(response.data);
                router.visit('/admin/employee-progress', {
                    data: {
                        period: selectedPeriod,
                        from_date: dateRange.from_date,
                        to_date: dateRange.to_date,
                    },
                    preserveState: true,
                });
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);
    };

    const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateRange((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredEmployees = progressData.data.filter((employee) =>
        employee.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getEmployeeDetails = (employeeId: number) => {
        const employee = progressData.data.find((emp) => emp.user_id === employeeId);
        return employee || null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Progress" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Employee Progress</h1>
                            <p className="text-muted-foreground">
                                Monitor daily, weekly, and monthly progress of employees
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={fetchEmployeeProgress}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {isLoading ? 'Refreshing...' : 'Refresh Data'}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Filter employee progress data by period and date range</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="period">Period</Label>
                                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                                    <SelectTrigger id="period">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="from_date">From Date</Label>
                                <Input
                                    id="from_date"
                                    name="from_date"
                                    type="date"
                                    value={dateRange.from_date}
                                    onChange={handleDateRangeChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="to_date">To Date</Label>
                                <Input
                                    id="to_date"
                                    name="to_date"
                                    type="date"
                                    value={dateRange.to_date}
                                    onChange={handleDateRangeChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={fetchEmployeeProgress}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Apply Filters
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedPeriod('daily');
                                    setDateRange({ from_date: '', to_date: '' });
                                }}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{progressData.total_employees}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{progressData.total_time} hours</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{progressData.total_tasks}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Employee Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Employee Progress</CardTitle>
                        <CardDescription>
                            Overview of employee progress for the selected period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Total Time (hours)</TableHead>
                                    <TableHead>Tasks Completed</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((employee) => (
                                        <TableRow key={employee.user_id}>
                                            <TableCell>
                                                <div className="font-medium">{employee.user_name}</div>
                                                <div className="text-sm text-muted-foreground">{employee.email}</div>
                                            </TableCell>
                                            <TableCell>{employee.total_time.toFixed(2)}</TableCell>
                                            <TableCell>{employee.tasks_completed}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                                                            style={{ width: `${(employee.total_time / (progressData.total_time || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {((employee.total_time / (progressData.total_time || 1)) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedEmployee(employee.user_id)}
                                                >
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                            No employees found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Employee Details Dialog */}
                {selectedEmployee && (
                    <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Employee Details</DialogTitle>
                                <DialogDescription>
                                    Detailed progress information for the selected employee
                                </DialogDescription>
                            </DialogHeader>

                            {(() => {
                                const employee = getEmployeeDetails(selectedEmployee);
                                if (!employee) return null;

                                return (
                                    <div className="space-y-6">
                                        {/* Employee Info */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Employee Name</h4>
                                                <p className="text-sm text-muted-foreground">{employee.user_name}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Email</h4>
                                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Total Time</h4>
                                                <p className="text-sm text-muted-foreground">{employee.total_time.toFixed(2)} hours</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Tasks Completed</h4>
                                                <p className="text-sm text-muted-foreground">{employee.tasks_completed}</p>
                                            </div>
                                        </div>

                                        {/* Daily Reports */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium">Daily Reports</h4>
                                            {Object.entries(employee.daily_reports).length > 0 ? (
                                                Object.entries(employee.daily_reports).map(([date, report]) => (
                                                    <Card key={date}>
                                                        <CardHeader>
                                                            <CardTitle className="text-sm font-medium">
                                                                {format(new Date(date), 'MMM dd, yyyy')}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                <div>
                                                                    <h5 className="text-sm font-medium mb-1">Total Time</h5>
                                                                    <p className="text-sm text-muted-foreground">{report.total_time.toFixed(2)} hours</p>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-medium mb-1">Tasks Completed</h5>
                                                                    <p className="text-sm text-muted-foreground">{report.tasks_completed}</p>
                                                                </div>
                                                            </div>

                                                            {/* Events */}
                                                            {report.events.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h5 className="text-sm font-medium">Events</h5>
                                                                    <div className="space-y-2">
                                                                        {report.events.map((event, index) => (
                                                                            <div key={index} className="border rounded-lg p-3">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center space-x-2">
                                                                                        <Badge variant="secondary" className="text-xs">
                                                                                            {event.event_type}
                                                                                        </Badge>
                                                                                        <span className="text-sm font-medium">{event.event_name}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-2 text-sm text-muted-foreground">
                                                                                    {event.event_description}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No daily reports available</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}