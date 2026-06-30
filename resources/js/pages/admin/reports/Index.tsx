import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Employee } from '@/types';
import ReportForm from '@/components/reports/ReportForm';
import ReportGroup, {
    groupReportsByDate,
    groupReportsByEmployee,
    type Report,
    type TaskTimeEntry,
} from '@/components/reports/ReportGroup';
import WizCardDesign1 from '@/components/wizards/WizCardDesign1';
import { Head } from '@inertiajs/react';
import {
    ActionIcon,
    Button,
    Card,
    Divider,
    Group,
    NativeSelect,
    Pagination,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { Clock, Download, FileText, Paperclip, Plus, Search, Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

interface ReportsIndexProps {
    employees: Employee[];
    userPermissions: string[];
    isSuperAdmin: boolean;
    isAdminView?: boolean;
    authUser: { id: number; name: string };
}

const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
];

const getEntrySeconds = (entry: Omit<TaskTimeEntry, 'description'> & { description?: string | null }): number => {
    if (typeof entry.working_duration === 'number') {
        return entry.working_duration;
    }

    if (typeof entry.duration_hours === 'number') {
        return entry.duration_hours * 3600;
    }

    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : null;

    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
        return 0;
    }

    if (!end) {
        return 0;
    }

    return Math.max(0, (end.getTime() - start.getTime()) / 1000);
};

const getReportTotalSeconds = (report: Report): number => {
    if (Array.isArray(report.tasks) && report.tasks.length > 0) {
        return report.tasks.reduce((taskAcc, task) => {
            if (typeof task.total_working_seconds === 'number') {
                return taskAcc + task.total_working_seconds;
            }

            const taskSeconds =
                task.time_entries?.reduce((entryAcc, entry) => {
                    return entryAcc + getEntrySeconds(entry);
                }, 0) || 0;

            return taskAcc + taskSeconds;
        }, 0);
    }

    return report.total_hours * 3600;
};

export default function ReportsIndex(props: ReportsIndexProps) {
    const {
        employees: initialEmployees = [],
        userPermissions = [],
        isSuperAdmin = false,
        isAdminView: isAdminViewProp,
        authUser,
    } = props;

    const isAdminView =
        typeof isAdminViewProp === 'boolean'
            ? isAdminViewProp
            : isSuperAdmin ||
              userPermissions.length === 0 ||
              userPermissions.includes('report.view') ||
              userPermissions.includes('report.view_all') ||
              userPermissions.includes('reports.view') ||
              userPermissions.includes('reports.view_all');

    const canExportConsolidated =
        isSuperAdmin ||
        userPermissions.length === 0 ||
        userPermissions.includes('report.export');

    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(50);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<Employee | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);

    useEffect(() => {
        if (!isAdminView) {
            return;
        }

        if (initialEmployees.length > 0) {
            return;
        }

        fetch('/admin/api/reports/employees')
            .then((response) => response.json())
            .then((data) => setEmployees(data))
            .catch((error) => console.error('Error fetching employees:', error));
    }, [initialEmployees.length, isAdminView]);

    const fetchMyReports = useCallback(() => {
        setLoading(true);
        axios
            .get(`/admin/api/reports/employee/${authUser.id}`, {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    page: currentPage,
                    per_page: itemsPerPage,
                },
            })
            .then((response) => {
                setReports(response.data.data);
                setTotalItems(response.data.total);
            })
            .catch((error) => {
                console.error('Error fetching my reports:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [authUser.id, currentPage, endDate, itemsPerPage, startDate]);

    const fetchAllReports = useCallback(() => {
        setLoading(true);
        axios
            .get('/admin/api/reports/all', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    page: currentPage,
                    per_page: itemsPerPage,
                    employee_id: selectedEmployeeFilter?.id,
                    status: statusFilter,
                    search: searchQuery,
                },
            })
            .then((response) => {
                setReports(response.data.data);
                setTotalItems(response.data.total);
            })
            .catch((error) => {
                console.error('Error fetching all reports:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currentPage, endDate, itemsPerPage, searchQuery, selectedEmployeeFilter?.id, startDate, statusFilter]);

    useEffect(() => {
        if (isAdminView) {
            fetchAllReports();
            return;
        }

        fetchMyReports();
    }, [fetchAllReports, fetchMyReports, isAdminView]);

    const stats = useMemo(() => {
        const totalReports = reports.length;
        const totalTimeSpentSeconds = reports.reduce((sum, report) => sum + getReportTotalSeconds(report), 0);
        const uniqueTasks = new Set(reports.flatMap((report) => report.tasks?.map((task) => task.id) || [])).size;
        const withAttachments = reports.filter((report) => report.attachments?.length > 0).length;
        const activeEmployees = new Set(reports.map((report) => report.user_id)).size;

        return {
            totalReports,
            totalHoursRounded: Math.round(totalTimeSpentSeconds / 3600),
            uniqueTasks,
            withAttachments,
            activeEmployees,
        };
    }, [reports]);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const matchesSearch =
                searchQuery === '' ||
                report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.tasks?.some((task) => task.title.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === '' || report.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [reports, searchQuery, statusFilter]);

    const groupedReports = useMemo(() => {
        if (isAdminView && !selectedEmployeeFilter) {
            return groupReportsByEmployee(filteredReports);
        }

        return groupReportsByDate(filteredReports);
    }, [filteredReports, isAdminView, selectedEmployeeFilter]);

    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    const employeeOptions = (employees && employees.length > 0) ? employees.map((employee) => ({
        value: String(employee.id),
        label: employee.name,
    })) : [];

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        if (isAdminView) {
            setSelectedEmployeeFilter(null);
        }
    };

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

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <WizCardDesign1 title="Total Reports" text="Loaded in view" stats={stats.totalReports} icon={FileText} color="blue" />
                    <WizCardDesign1 title="Hours" text="Rounded total" stats={stats.totalHoursRounded} icon={Clock} color="purple" />
                    <WizCardDesign1 title="Tasks" text="Unique tasks" stats={stats.uniqueTasks} icon={Tag} color="green" />
                    <WizCardDesign1 title="Attachments" text="Reports w/ files" stats={stats.withAttachments} icon={Paperclip} color="orange" />
                </div>

                <Card withBorder radius="md" p="sm">
                    <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
                        <div>
                            <Text fw={600} size="sm">
                                {isAdminView
                                    ? selectedEmployeeFilter
                                        ? `Reports for ${selectedEmployeeFilter.name}`
                                        : 'Employees reports'
                                    : 'My reports'}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {filteredReports.length} of {reports.length} reports shown
                                {isAdminView && !selectedEmployeeFilter ? ` • ${stats.activeEmployees} employees` : null}
                            </Text>
                        </div>

                        <Group gap="xs">
                            {isAdminView ? (
                                <Button
                                    variant="light"
                                    leftSection={<Download size={16} />}
                                    onClick={handleExportConsolidated}
                                    loading={isExportingConsolidated}
                                >
                                    Export
                                </Button>
                            ) : null}
                            {!isAdminView ? (
                                <Button leftSection={<Plus size={16} />} onClick={() => setIsReportDialogOpen(true)}>
                                    New
                                </Button>
                            ) : null}
                        </Group>
                    </Group>

                    <Divider my="sm" />

                    {isAdminView ? (
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="sm">
                            <Select
                                label="Employee"
                                placeholder="All employees"
                                data={[{ value: '', label: 'All employees' }, ...employeeOptions]}
                                value={selectedEmployeeFilter?.id ? String(selectedEmployeeFilter.id) : ''}
                                onChange={(value) => {
                                    if (!value) {
                                        setSelectedEmployeeFilter(null);
                                        return;
                                    }

                                    const employee = employees.find((emp) => emp.id === Number(value));
                                    setCurrentPage(1);
                                    setSelectedEmployeeFilter(employee ?? null);
                                }}
                                searchable
                                clearable
                            />

                            <Select
                                label="Status"
                                data={statusOptions}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value ?? '')}
                            />
                            <TextInput label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} />
                            <TextInput label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} />
                            <TextInput
                                label="Search"
                                placeholder="Title, employee, task…"
                                leftSection={<Search size={16} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            />
                        </SimpleGrid>
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
                            <Select
                                label="Status"
                                data={statusOptions}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value ?? '')}
                            />
                            <TextInput label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} />
                            <TextInput label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} />
                            <TextInput
                                label="Search"
                                placeholder="Title, task…"
                                leftSection={<Search size={16} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            />
                        </SimpleGrid>
                    )}

                    {(statusFilter || searchQuery || (isAdminView && selectedEmployeeFilter)) && (
                        <Group justify="flex-end" mt="sm">
                            <ActionIcon variant="subtle" aria-label="Clear filters" onClick={clearFilters}>
                                <Tag size={16} />
                            </ActionIcon>
                        </Group>
                    )}

                    <Divider my="sm" />

                    {loading ? (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                            Loading reports…
                        </Text>
                    ) : filteredReports.length > 0 ? (
                        <Stack gap="md">
                            {Array.from(groupedReports.entries()).map(([groupKey, groupReports]) => (
                                <ReportGroup
                                    key={groupKey}
                                    reports={groupReports}
                                    authUser={authUser}
                                    groupBy={isAdminView && !selectedEmployeeFilter ? 'employee' : 'date'}
                                    showEmployee={isAdminView && !selectedEmployeeFilter}
                                    showDate={true}
                                    onDelete={() => {
                                        if (isAdminView) {
                                            fetchAllReports();
                                            return;
                                        }

                                        fetchMyReports();
                                    }}
                                    showTimeEntries={true}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                            {searchQuery || statusFilter || (isAdminView && selectedEmployeeFilter)
                                ? 'No reports match your filters.'
                                : 'No reports found for this date range.'}
                        </Text>
                    )}
                </Card>

                {reports.length > 0 && (
                    <Card withBorder radius="md" p="sm">
                        <Group justify="space-between" wrap="wrap" gap="sm">
                            <Group gap="xs">
                                <Text size="xs" c="dimmed">
                                    Per page
                                </Text>
                                <NativeSelect
                                    size="xs"
                                    value={String(itemsPerPage)}
                                    data={[
                                        { value: '5', label: '5' },
                                        { value: '20', label: '20' },
                                        { value: '50', label: '50' },
                                        { value: '100', label: '100' },
                                    ]}
                                    onChange={(e) => setItemsPerPage(Number(e.currentTarget.value))}
                                />
                            </Group>

                            <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} size="sm" siblings={1} boundaries={1} />
                        </Group>
                    </Card>
                )}
            </div>

            <ReportForm open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen} tasks={reports.flatMap((report) => report.tasks)} />
        </AppLayout>
    );
}
