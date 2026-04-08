import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Employee } from '@/types';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Clock, FileText, Tag, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { ActionIcon } from '@mantine/core';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportForm from '@/components/reports/ReportForm';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Reports',
        href: '/admin/reports',
    },
];

interface ReportAttachment {
    id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    metadata: unknown;
}

interface TaskTimeEntry {
    id: number;
    start_time: string;
    end_time: string;
    duration_hours: number;
    description: string;
}

interface Task {
    id: number;
    title: string;
    task_code: string;
    description: string;
    state: string;
    time_entries: TaskTimeEntry[];
    total_time_spent: number;
    estimate_hours?: string;
    project_id?: number;
    department_id?: number;
    pivot?: {
        remarks?: string;
    };
}

interface Report {
    id: number;
    user_id: number;
    user: { id: number; name: string };
    report_date: string;
    title: string;
    description: string;
    total_hours: number;
    status: string;
    created_at: string;
    metadata?: {
        time_spent?: string;
    };
    tasks: Task[];
    attachments: ReportAttachment[];
}

interface ReportsIndexProps {
    employees: Employee[];
    userPermissions: string[];
    isSuperAdmin: boolean;
    authUser: { id: number; name: string };
}

export default function ReportsIndex(props: ReportsIndexProps) {
    const {
        employees: initialEmployees = [],
        userPermissions = [],
        isSuperAdmin = false,
        authUser
    } = props;

    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<Employee | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('all-reports');
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);

    useEffect(() => {
        if (initialEmployees.length === 0) {
            fetch('/admin/api/reports/employees')
                .then(response => response.json())
                .then(data => setEmployees(data))
                .catch(error => console.error('Error fetching employees:', error));
        }
    }, [initialEmployees]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
    };

    const handleFilterByEmployee = (employee: Employee | null) => {
        setSelectedEmployeeFilter(employee);
    };

    const handleViewDetails = (report: Report) => {
        router.visit(`/admin/reports/${report.id}`);
    };

    const handleDeleteReport = (report: Report) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            axios.delete(`/admin/api/reports/${report.id}`)
                .then(() => {
                    toast.success('Report deleted successfully');
                    if (activeTab === 'my-reports') {
                        fetchMyReports();
                    } else {
                        fetchAllReports();
                    }
                })
                .catch(error => {
                    console.error('Error deleting report:', error);
                    toast.error(error.response?.data?.error || 'Failed to delete report');
                });
        }
    };

    const formatDuration = (hours: number): string => {
        const totalSeconds = Math.floor(hours * 3600);
        const hoursPart = Math.floor(totalSeconds / 3600);
        const minutesPart = Math.floor((totalSeconds % 3600) / 60);
        const secondsPart = totalSeconds % 60;
        return `${hoursPart}h ${minutesPart}m ${secondsPart}s`;
    };

    const getStatusColor = (status: string): string => {
        const statusColors: Record<string, string> = {
            'draft': 'bg-yellow-100 text-yellow-800',
            'submitted': 'bg-blue-100 text-blue-800',
            'approved': 'bg-green-100 text-green-800',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const canEditOrDelete = (report: Report): boolean => {
        const createdAt = new Date(report.created_at);
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return report.user_id === authUser.id && diffHours <= 2;
    };

    // Computed statistics
    const stats = useMemo(() => {
        const totalReports = reports.length;
        const totalTimeSpent = reports.reduce((sum, report) => {
            return sum + (isNaN(report.total_hours) ? 0 : Number(report.total_hours));
        }, 0);
        const uniqueTasks = new Set(reports.flatMap(e => e.tasks?.map(t => t.id) || [])).size;
        const withAttachments = reports.filter(e => e.attachments?.length > 0).length;

        return { totalReports, totalTimeSpent, uniqueTasks, withAttachments };
    }, [reports]);

    // Filtered reports based on search and status
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const matchesSearch = searchQuery === '' ||
                report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.tasks?.some(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === '' || report.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [reports, searchQuery, statusFilter]);

    useEffect(() => {
        if (activeTab === 'all-reports') {
            fetchAllReports();
        } else {
            fetchMyReports();
        }
    }, [currentPage, activeTab, startDate, endDate, itemsPerPage, selectedEmployeeFilter, statusFilter, searchQuery]);

    // Function to fetch my reports
    const fetchMyReports = () => {
        setLoading(true);
        axios.get(`/admin/api/reports/employee/${authUser.id}`, {
            params: {
                start_date: startDate,
                end_date: endDate,
                page: currentPage,
                per_page: itemsPerPage
            }
        })
            .then(response => {
                setReports(response.data.data);
                setTotalItems(response.data.total);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching my reports:', error);
                setLoading(false);
            });
    };

    // Function to fetch all reports
    const fetchAllReports = () => {
        setLoading(true);
        axios.get('/admin/api/reports/all', {
            params: {
                start_date: startDate,
                end_date: endDate,
                page: currentPage,
                per_page: itemsPerPage,
                employee_id: selectedEmployeeFilter?.id,
                status: statusFilter,
                search: searchQuery
            }
        })
            .then(response => {
                setReports(response.data.data);
                setTotalItems(response.data.total);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching all reports:', error);
                setLoading(false);
            });
    };

    const canExportConsolidated =
        isSuperAdmin ||
        userPermissions.includes('report.export') ||
        userPermissions.length === 0;

    const handleExportConsolidated = async () => {
        if (!startDate || !endDate) {
            toast.error('Please select a valid start and end date before export.');
            return;
        }

        setIsExportingConsolidated(true);
        try {
            const response = await axios.get('/admin/api/reports/consolidated/export', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    employee_ids: selectedEmployeeFilter ? [selectedEmployeeFilter.id] : undefined,
                    status: statusFilter || undefined,
                    search: searchQuery || undefined,
                    format: 'csv',
                },
                responseType: 'blob',
            });

            const contentDisposition = response.headers['content-disposition'] as string | undefined;
            const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
            const filename = filenameMatch?.[1] || `consolidated_reports_${startDate}_to_${endDate}.csv`;

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Consolidated report exported successfully');
        } catch (error) {
            console.error('Error exporting consolidated report:', error);
            toast.error('Failed to export consolidated report');
        } finally {
            setIsExportingConsolidated(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daily Reports" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
                        <p className="text-muted-foreground">
                            View and analyze employee daily work reports
                        </p>
                    </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalReports}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.withAttachments} with attachments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDuration(stats.totalTimeSpent)}</div>
                            <p className="text-xs text-muted-foreground">
                                Across all reports
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unique Tasks</CardTitle>
                            <Tag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.uniqueTasks}</div>
                            <p className="text-xs text-muted-foreground">
                                Tasks reported on
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{employees.length}</div>
                            <p className="text-xs text-muted-foreground">
                                In the system
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="all-reports">All Reports</TabsTrigger>
                        <TabsTrigger value="my-reports">My Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-reports" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Filters</CardTitle>
                                <CardDescription>Refine your report view</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium">From Date</label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-medium">To Date</label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label className="text-sm font-medium">Report Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="mt-1 w-full p-2 border rounded-md"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="draft">Draft</option>
                                            <option value="submitted">Submitted</option>
                                            <option value="approved">Approved</option>
                                        </select>
                                    </div>
                                </div>


                                {/* Clear Filters */}
                                {statusFilter && (
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setStatusFilter('');
                                            }}
                                        >
                                            Clear All Filters
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* My Reports List */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>My Reports</CardTitle>
                                        <CardDescription>
                                            {filteredReports.length} of {reports.length} reports shown
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => setIsReportDialogOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        New
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading reports...
                                    </div>
                                ) : filteredReports.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b bg-gray-50">
                                                    <th className="text-left p-4 font-semibold">Report Date</th>
                                                    <th className="text-left p-4 font-semibold">Title</th>
                                                    <th className="text-left p-4 font-semibold">Status</th>
                                                    <th className="text-left p-4 font-semibold">Tasks</th>
                                                    <th className="text-left p-4 font-semibold">Total Time</th>
                                                    <th className="text-right p-4 font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredReports.map(report => (
                                                    <tr key={report.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="p-4">
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(report.report_date).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-medium">{report.title}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge className={getStatusColor(report.status)}>
                                                                {report.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium">{report.tasks?.length || 0} task{report.tasks?.length > 1 ? 's' : ''}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDuration(report.total_hours)}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex justify-end gap-2">
                                                                <ActionIcon
                                                                    variant="filled"
                                                                    color="gray"
                                                                    aria-label="View Details"
                                                                    onClick={() => handleViewDetails(report)}
                                                                >
                                                                    <Eye className='w-4' />
                                                                </ActionIcon>
                                                                {canEditOrDelete(report) && (
                                                                    <>
                                                                        <ActionIcon
                                                                            variant="filled"
                                                                            color="blue"
                                                                            aria-label="Edit"
                                                                            onClick={() => router.visit(`/admin/reports/${report.id}/edit`)}
                                                                        >
                                                                            <Edit className='w-4' />
                                                                        </ActionIcon>
                                                                        <ActionIcon
                                                                            variant="filled"
                                                                            color="red"
                                                                            aria-label="Delete"
                                                                            onClick={() => handleDeleteReport(report)}
                                                                        >
                                                                            <Trash2 className='w-4' />
                                                                        </ActionIcon>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {searchQuery || statusFilter
                                            ? 'No reports match your filters.'
                                            : 'No reports found for this date range.'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="all-reports" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">Filters</CardTitle>
                                    <CardDescription>Refine your report view</CardDescription>
                                </div>
                                {canExportConsolidated && (
                                    <Button
                                        variant="outline"
                                        onClick={handleExportConsolidated}
                                        disabled={isExportingConsolidated}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {isExportingConsolidated ? 'Exporting...' : 'Export Consolidated'}
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Employee Selection */}
                                <div className="grid md:grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-sm font-medium">Employee</label>
                                        <select
                                            value={selectedEmployeeFilter?.id || ''}
                                            onChange={(e) => {
                                                const employeeId = e.target.value;
                                                if (employeeId === '') {
                                                    handleFilterByEmployee(null);
                                                } else {
                                                    const employee = employees.find(emp => emp.id === parseInt(employeeId));
                                                    handleFilterByEmployee(employee || null);
                                                }
                                            }}
                                            className="mt-1 w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map((employee) => (
                                                <option key={employee.id} value={employee.id}>
                                                    {employee.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Report Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="mt-1 w-full p-2 border rounded-md"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="draft">Draft</option>
                                            <option value="submitted">Submitted</option>
                                            <option value="approved">Approved</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium">From Date</label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-medium">To Date</label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Search */}
                                <div>
                                    <label className="text-sm font-medium">Search</label>
                                    <div className="relative mt-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search reports, tasks, or employees..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {(selectedEmployeeFilter || statusFilter || searchQuery) && (
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                handleFilterByEmployee(null);
                                                setStatusFilter('');
                                                setSearchQuery('');
                                            }}
                                        >
                                            Clear All Filters
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            {selectedEmployeeFilter ? `Reports for ${selectedEmployeeFilter.name}` : 'All Reports'}
                                        </CardTitle>
                                        <CardDescription>
                                            {filteredReports.length} of {reports.length} reports shown
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading reports...
                                    </div>
                                ) : filteredReports.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b bg-gray-50">
                                                    <th className="text-left p-4 font-semibold">Report Date</th>
                                                    <th className="text-left p-4 font-semibold">Employee</th>
                                                    <th className="text-left p-4 font-semibold">Title</th>
                                                    <th className="text-left p-4 font-semibold">Status</th>
                                                    <th className="text-left p-4 font-semibold">Tasks</th>
                                                    <th className="text-left p-4 font-semibold">Total Time</th>
                                                    <th className="text-right p-4 font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredReports.map(report => (
                                                    <tr key={report.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="p-4">
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(report.report_date).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-medium">{report.user?.name || 'N/A'}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-medium">{report.title}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge className={getStatusColor(report.status)}>
                                                                {report.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium">{report.tasks?.length || 0} tasks</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDuration(report.total_hours)}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex justify-end gap-2">
                                                                <ActionIcon
                                                                    variant="filled"
                                                                    color="gray"
                                                                    aria-label="View Details"
                                                                    onClick={() => handleViewDetails(report)}
                                                                >
                                                                    <Eye className='w-4' />
                                                                </ActionIcon>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {searchQuery || statusFilter || selectedEmployeeFilter
                                            ? 'No reports match your filters.'
                                            : 'No reports found for this date range.'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Pagination */}
                {reports.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                className="p-2 border rounded-md"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                            <span className="text-sm text-muted-foreground">per page</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground px-4">
                                Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Report Dialog */}
            <ReportForm
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                tasks={reports.flatMap(report => report.tasks)}
            />
        </AppLayout>
    );
}
