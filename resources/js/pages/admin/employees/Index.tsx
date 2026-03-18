import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Employee, type Department, type Role, type UserPermission } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
    employees: {
        data: Employee[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    departments: Department[];
    filters: {
        department_id?: string;
        search?: string;
    };
    userPermissions: string[];
    isSuperAdmin: boolean;
}

export default function EmployeesIndex(props: EmployeesIndexProps) {
    const {
        employees,
        departments,
        filters = {},
        userPermissions = [],
        isSuperAdmin = false
    } = props;


    // Local state for filter values
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        department_id: filters.department_id || 'all'
    });

    // Track first render so search debounce does not auto-fire on initial load
    const hasRenderedRef = useRef(false);

    // Form handling for filters
    const { get } = useForm();

    const canCreate = userPermissions.includes('employee.create') || isSuperAdmin;
    const canRead = userPermissions.includes('employee.read') || isSuperAdmin;
    const canEdit = userPermissions.includes('employee.update') || isSuperAdmin;

    // Debounced search ref to cancel previous requests
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle search input change - debounce is handled by useEffect
    const buildQuery = (search: string, department_id: string) => {
        const queryParams = new URLSearchParams();
        if (search.trim()) {
            queryParams.set('search', search.trim());
        }
        if (department_id !== 'all') {
            queryParams.set('department_id', department_id);
        }
        const queryString = queryParams.toString();
        return queryString ? `/admin/employees?${queryString}` : '/admin/employees';
    };

    const shouldVisit = (url: string) => {
        const currentSearch = window.location.search ? window.location.search : '';
        const targetSearch = url.includes('?') ? `?${url.split('?')[1]}` : '';
        return currentSearch !== targetSearch;
    };

    const handleSearchChange = (value: string) => {
        setLocalFilters(prev => ({ ...prev, search: value }));
    };

    // Handle search with debounce (1 second delay)
    useEffect(() => {
        // Skip first render
        if (!hasRenderedRef.current) {
            hasRenderedRef.current = true;
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const url = buildQuery(localFilters.search, localFilters.department_id);
            if (shouldVisit(url)) {
                get(url);
            }
        }, 1000);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [localFilters.search, localFilters.department_id]);

    const handleDepartmentChange = (value: string) => {
        setLocalFilters(prev => ({ ...prev, department_id: value }));
        const url = buildQuery(localFilters.search, value);
        if (shouldVisit(url)) {
            get(url);
        }
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setLocalFilters({
            search: '',
            department_id: 'all'
        });
        get('/admin/employees');
    };

    // Check if any filters are active
    const hasActiveFilters = localFilters.search.trim() || localFilters.department_id !== 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                        <p className="text-muted-foreground">
                            Manage employee information and department assignments
                        </p>
                    </div>
                    {canCreate ? (
                        <Button asChild>
                            <Link href="/admin/employees/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Employee
                            </Link>
                        </Button>
                    ) : null}
                </div>

                {/* Employees List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <CardTitle>Employees</CardTitle>
                            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                <div className="flex-1">
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
                            <div className="w-full md:w-48">
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
                            {hasActiveFilters && (
                                <Button type="button" variant="ghost" onClick={handleClearFilters}>
                                    Clear
                                </Button>
                            )}
                            </div>
                        </div>
                        <CardDescription>
                            {employees.total} employee{employees.total !== 1 ? 's' : ''} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-4 font-semibold">Name</th>
                                        <th className="text-left p-4 font-semibold">Email</th>
                                        <th className="text-left p-4 font-semibold">Department</th>
                                        <th className="text-left p-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.data.map((employee) => {
                                        const permissionCounts = (employee as any)?.permission_counts || {
                                            role: 0,
                                            additional: 0,
                                            restricted: 0,
                                            total: 0
                                        };

                                        return (
                                            <tr key={employee.id} className="border-b hover:bg-gray-50 transition-colors">
                                                {/* Name and Phone */}
                                                <td className="p-4">
                                                    <div>
                                                        <div className="font-semibold">{employee.name}</div>
                                                        {employee.phone && (
                                                            <div className="text-sm text-muted-foreground">{employee.phone}</div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Email */}
                                                <td className="p-4">
                                                    <div className="text-sm">{employee.email}</div>
                                                </td>

                                                {/* Department */}
                                                <td className="p-4">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {employee.department?.name || 'No Department'}
                                                    </Badge>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {canRead && (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/admin/employees/${employee.id}`}>
                                                                    View
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {canEdit && (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/admin/employees/${employee.id}/edit`}>
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {employees.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((employees.current_page - 1) * employees.per_page) + 1} to {Math.min(employees.current_page * employees.per_page, employees.total)} of {employees.total} results
                                </div>
                                <div className="flex items-center gap-2">
                                    {employees.current_page > 1 && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/admin/employees?page=${employees.current_page - 1}${localFilters.search ? `&search=${localFilters.search}` : ''}${localFilters.department_id !== 'all' ? `&department_id=${localFilters.department_id}` : ''}`}>
                                                Previous
                                            </Link>
                                        </Button>
                                    )}
                                    
                                    <div className="text-sm text-muted-foreground">
                                        Page {employees.current_page} of {employees.last_page}
                                    </div>
                                    
                                    {employees.current_page < employees.last_page && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/admin/employees?page=${employees.current_page + 1}${localFilters.search ? `&search=${localFilters.search}` : ''}${localFilters.department_id !== 'all' ? `&department_id=${localFilters.department_id}` : ''}`}>
                                                Next
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}