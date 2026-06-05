import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Employee, type Department, type Visitor, type PaginatedItem, Auth } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, X, ExternalLink, User, Mail, Phone, Building, ChevronRight, Calendar } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import VisitorFormModal from '@/components/admin/employees/VisitorFormModal';
import ShiftChangePanel from '@/components/admin/employees/ShiftChangePanel';
import axios from 'axios';
import { Tabs } from '@mantine/core';
import { AttendanceCalendar } from '@/components/attendance';
import { LeavePanel } from '@/components/admin/employees/LeavePanel';
import EmployeeTaskProgress from '@/components/admin/employees/EmployeeTaskProgress';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Employees',
        href: '/admin/employees',
    },
];

interface EmployeesIndexProps {
    auth: Auth;
    departments: Department[];
    filters?: {
        department_id?: string;
        search?: string;
    };
    userPermissions: string[];
    isSuperAdmin: boolean;
}

type EmployeeDetail = Employee & {
    category?: {
        id: number;
        name: string;
        description?: string | null;
    };
    currentShiftAssignment?: {
        id: number;
        shift?: {
            name: string;
            start_time: string;
            end_time: string;
        };
        effective_from: string;
        effective_to?: string | null;
    };
    shiftAssignmentHistory?: Array<{
        id: number;
        shift?: {
            name: string;
        };
        effective_from: string;
        effective_to?: string | null;
    }>;
};

export default function EmployeesIndex(props: EmployeesIndexProps) {
    const {
        auth,
        departments,
        filters = {},
        userPermissions = [],
        isSuperAdmin = false,
    } = props;

    const [employees, setEmployees] = useState<PaginatedItem<Employee> | null>(null);
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<EmployeeDetail | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('details');
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        department_id: filters.department_id || 'all',
    });
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const canCreate = userPermissions.includes('employee.create') || isSuperAdmin;
    const canEdit = userPermissions.includes('employee.update') || isSuperAdmin;
    const isPanelOpen = selectedEmployee !== null;

    const updateBrowserUrl = (page: number, filters: { search: string; department_id: string }) => {
        const queryParams = new URLSearchParams();

        if (filters.search.trim()) {
            queryParams.set('search', filters.search.trim());
        }
        if (filters.department_id !== 'all') {
            queryParams.set('department_id', filters.department_id);
        }
        if (page > 1) {
            queryParams.set('page', page.toString());
        }

        const nextUrl = queryParams.toString() ? `/admin/employees?${queryParams.toString()}` : '/admin/employees';
        window.history.replaceState({}, '', nextUrl);
    };

    const loadEmployees = async (
        page = 1,
        overrideFilters?: { search: string; department_id: string }
    ) => {
        const searchValue = overrideFilters?.search ?? localFilters.search;
        const departmentValue = overrideFilters?.department_id ?? localFilters.department_id;

        const params: Record<string, string | number> = { page };
        if (searchValue.trim()) {
            params.search = searchValue.trim();
        }
        if (departmentValue !== 'all') {
            params.department_id = departmentValue;
        }

        setEmployeesLoading(true);

        try {
            const response = await axios.get('/admin/employees', {
                params,
                headers: { Accept: 'application/json' },
            });

            const responseData = response.data as PaginatedItem<Employee>;
            setEmployees(responseData);
            setCurrentPage(responseData.current_page);
            updateBrowserUrl(responseData.current_page, {
                search: searchValue,
                department_id: departmentValue,
            });
        } catch (error) {
            console.error('Error loading employees:', error);
            setEmployees(null);
        } finally {
            setEmployeesLoading(false);
        }
    };

    const loadEmployeeDetails = async (employeeId: number) => {
        setDetailLoading(true);

        try {
            const response = await axios.get(`/admin/employees/${employeeId}`, {
                headers: { Accept: 'application/json' },
            });
            const result = response.data;
            setSelectedEmployeeDetails(result.employee ?? result);
        } catch (error) {
            console.error('Error loading employee details:', error);
            setSelectedEmployeeDetails(null);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees(1, localFilters);
    }, []);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setCurrentPage(1);
            loadEmployees(1);
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [localFilters.search]);

    const handleSearchChange = (value: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        setLocalFilters(prev => ({ ...prev, search: value }));
    };

    const handleDepartmentChange = (value: string | null) => {
        const nextFilters = { ...localFilters, department_id: value ?? 'all' };
        setLocalFilters(nextFilters);
        setCurrentPage(1);
        loadEmployees(1, nextFilters);
    };

    const handleClearFilters = () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const nextFilters = { search: '', department_id: 'all' };
        setLocalFilters(nextFilters);
        setCurrentPage(1);
        loadEmployees(1, nextFilters);
    };

    const handleSelectEmployee = (employee: Employee) => {
        if (selectedEmployee?.id === employee.id) {
            setSelectedEmployee(null);
            setSelectedEmployeeDetails(null);
            return;
        }

        setSelectedEmployee(employee);
        setSelectedEmployeeDetails(null);
        setActiveTab('details');
        loadEmployeeDetails(employee.id);
    };

    const goToPage = (page: number) => {
        if (!employees || page < 1 || page > employees.last_page) {
            return;
        }

        setCurrentPage(page);
        loadEmployees(page);
    };

    const detailEmployee = selectedEmployeeDetails ?? selectedEmployee;
    const hasActiveFilters = localFilters.search.trim() || localFilters.department_id !== 'all';

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 overflow-x-hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                        <p className="text-muted-foreground">Manage employee records, filters, and detail previews without reloading the page.</p>
                    </div>
                    {canCreate && (
                        <Button asChild>
                            <Link href="/admin/employees/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Employee
                            </Link>
                        </Button>
                    )}
                </div>

                <div className={`flex gap-4 items-start ${isPanelOpen ? '' : ''}`}>
                    <div className={isPanelOpen ? 'w-[380px] flex-shrink-0' : 'w-full'}>
                        <Card>
                            <CardHeader className="space-y-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle>Employees</CardTitle>
                                        <CardDescription>
                                            {employeesLoading
                                                ? 'Loading employees…'
                                                : `${employees?.total ?? 0} employee${employees?.total === 1 ? '' : 's'} found`}
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-start">
                                        <div>
                                            <label className="text-sm font-medium">Search</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search employees..."
                                                    className="pl-10"
                                                    value={localFilters.search}
                                                    onChange={(e) => handleSearchChange(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {isPanelOpen ? null :
                                            <div>
                                                <label className="text-sm font-medium">Department</label>
                                                <Select value={localFilters.department_id} onValueChange={handleDepartmentChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Departments" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Departments</SelectItem>
                                                        {departments.map((department) => (
                                                            <SelectItem key={department.id} value={department.id.toString()}>
                                                                {department.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        }
                                    </div>

                                    {hasActiveFilters && (
                                        <div className="flex items-end justify-end">
                                            <Button type="button" variant="ghost" onClick={handleClearFilters}>
                                                Clear
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {employeesLoading ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">Loading employees…</div>
                                ) : employees?.data.length ? (
                                    <>
                                        {isPanelOpen ? (
                                            <div className="space-y-2 p-2 max-h-[350px] overflow-y-auto">
                                                {employees.data.map((employee) => (
                                                    <div
                                                        key={employee.id}
                                                        className={`rounded-2xl border-b p-1 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer ${selectedEmployee?.id === employee.id ? 'border-blue-300 bg-slate-50' : 'border-slate-200 bg-white'}`}
                                                        onClick={() => handleSelectEmployee(employee)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback className="text-sm font-semibold text-slate-700">
                                                                    {getInitials(employee.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-slate-950 truncate">{employee.name}</div>
                                                                <div className="text-xs text-muted-foreground truncate">{employee.code || '—'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="border-b">
                                                            <th className="text-left p-4 font-semibold">Name</th>
                                                            <th className="text-left p-4 font-semibold">Code</th>
                                                            <th className="text-left p-4 font-semibold">Email</th>
                                                            <th className="text-left p-4 font-semibold">Department</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {employees.data.map((employee) => (
                                                            <tr
                                                                key={employee.id}
                                                                className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                                                                onClick={() => handleSelectEmployee(employee)}
                                                            >
                                                                <td className="p-4">
                                                                    <div className="font-semibold">{employee.name}</div>
                                                                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="text-sm font-mono">{employee.code || '—'}</div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="text-sm">{employee.email}</div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                        {(employee as any).department?.name || 'No Department'}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-sm text-muted-foreground">No employees match the current filters.</div>
                                )}

                                {employees?.last_page && employees.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t px-4 py-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {((employees.current_page || 0) - 1) * (employees.per_page || 0) + 1} to {Math.min((employees.current_page || 0) * (employees.per_page || 0), employees.total || 0)} of {employees.total} results
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                                                Previous
                                            </Button>
                                            <div className="text-xs text-muted-foreground">{currentPage}/{employees.last_page}</div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= employees.last_page}>
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {isPanelOpen && detailEmployee && (
                        <div className="flex-1 min-w-0">
                            <EmployeeDetailPanel
                                auth={auth}
                                employee={detailEmployee}
                                detailLoading={detailLoading}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                onClose={() => {
                                    setSelectedEmployee(null);
                                    setSelectedEmployeeDetails(null);
                                }}
                                canEdit={canEdit}
                            />
                        </div>
                    )}
                </div>

                <VisitorPanel />
            </div>
        </AppLayout>
    );
}

interface EmployeeDetailPanelProps {
    auth: Auth;
    employee: EmployeeDetail;
    detailLoading: boolean;
    activeTab: string | null;
    setActiveTab: (value: string | null) => void;
    onClose: () => void;
    canEdit: boolean;
}

function EmployeeDetailPanel(props: EmployeeDetailPanelProps) {
    const { auth, employee, detailLoading, activeTab, setActiveTab, onClose, canEdit } = props;
    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b pb-4 flex-shrink-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <CardTitle className="text-xl truncate">{employee.name}</CardTitle>
                        <CardDescription className="truncate">{employee.email}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {canEdit && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/employees/${employee.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/employees/${employee.id}`} title="Open full page">
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose} title="Close">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto pt-4">
                {detailLoading ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">Loading employee details…</div>
                ) : (
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                        keepMounted={false}
                    >
                        <Tabs.List className="grid grid-cols-3 gap-2 mb-6">
                            <Tabs.Tab value="details">Details</Tabs.Tab>
                            <Tabs.Tab value="attendance">Attendance</Tabs.Tab>
                            <Tabs.Tab value="leaves">Leaves</Tabs.Tab>
                            <Tabs.Tab value="shifts">Shifts</Tabs.Tab>
                            <Tabs.Tab value="works">Works</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="details" className="space-y-4">
                            <div className="rounded-lg border p-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    Basic Information
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Name</p>
                                        <p className="text-sm font-medium">{employee.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{employee.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Employee Code</p>
                                        <p className="text-sm font-mono">{employee.code || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{employee.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Category</p>
                                        <p className="text-sm">{employee.category?.name || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4 space-y-3">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Important dates</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Created At</p>
                                        <p className="text-sm">{employee.created_at ? new Date(employee.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Building className="h-4 w-4" />
                                    Department
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Department</p>
                                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                        {employee.department?.name || 'No Department'}
                                    </Badge>
                                </div>
                                {employee.department?.description && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Description</p>
                                        <p className="text-sm">{employee.department.description}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">Associated User</p>
                                    <p className="text-sm font-medium">{employee.user?.name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">{employee.user?.email || '—'}</p>
                                </div>
                            </div>
                        </Tabs.Panel>
                        {/* Attendance, leaves, and shifts */}
                        <Tabs.Panel value="attendance" className="space-y-4">
                            <div className="">
                                {activeTab === 'attendance' && (
                                    <AttendanceCalendar auth={auth} employeeId={employee.id} />
                                )}
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="leaves" className="space-y-4">
                            <div className="rounded-lg border p-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Leaves
                                </div>
                                {activeTab === 'leaves' && (
                                    <LeavePanel employeeId={employee.id} />
                                )}
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="shifts" className="space-y-4">
                            {activeTab === 'shifts' && (
                                <ShiftChangePanel employees={[]} selectedId={employee.id} />
                            )}
                        </Tabs.Panel>
                        <Tabs.Panel value="works" className="space-y-4">
                            {activeTab === 'works' && (
                                <EmployeeTaskProgress employeeId={employee.id} />
                            )}
                        </Tabs.Panel>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Visitor Panel (unchanged) ─────────────────────────────────────────────────

const VisitorPanel = () => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id?: number }>({ show: false });

    const fetchVisitors = async () => {
        try {
            setIsLoading(true);
            const { data } = await axios.get('/admin/visitors?per_page=10');
            setVisitors(data?.data || []);
        } catch (error) {
            console.error('Error fetching visitors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVisitors();
    }, []);

    const handleEdit = (visitor: Visitor) => {
        setSelectedVisitor(visitor);
        setShowFormModal(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`/admin/visitors/${id}`);
            fetchVisitors();
        } catch (error) {
            console.error('Error deleting visitor:', error);
        }
        setDeleteConfirm({ show: false });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Other Cards</CardTitle>
                            <CardDescription>
                                {visitors.length} card{visitors.length !== 1 ? 's' : ''} found
                            </CardDescription>
                        </div>
                        <Button onClick={() => {
                            setSelectedVisitor(null);
                            setShowFormModal(true);
                        }} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Card
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading cards...</p>
                        </div>
                    ) : visitors.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No cards found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-4 font-semibold">Code</th>
                                        <th className="text-left p-4 font-semibold">Name</th>
                                        <th className="text-left p-4 font-semibold">Card Number</th>
                                        <th className="text-left p-4 font-semibold">Status</th>
                                        <th className="text-left p-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visitors.map((visitor) => (
                                        <tr key={visitor.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="text-sm font-mono font-bold">{visitor.code}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">{visitor.name || '-'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-muted-foreground">{visitor.card_number || '-'}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={visitor.is_active ? 'default' : 'secondary'}
                                                    className={visitor.is_active ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                    {visitor.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(visitor)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setDeleteConfirm({ show: true, id: visitor.id })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <VisitorFormModal
                open={showFormModal}
                onOpenChange={setShowFormModal}
                visitor={selectedVisitor}
                onSuccess={() => {
                    setShowFormModal(false);
                    setSelectedVisitor(null);
                    fetchVisitors();
                }}
            />

            <Dialog open={deleteConfirm.show} onOpenChange={(open: boolean) => setDeleteConfirm({ show: open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Card</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this card? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-4 justify-end">
                        <Button type="button" variant="outline" onClick={() => setDeleteConfirm({ show: false })}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
