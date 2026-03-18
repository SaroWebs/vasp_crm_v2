import AppLayout from '@/layouts/app-layout';
import { Department, Employee, Permission, Role, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Employees',
        href: '/admin/employees',
    },
    {
        title: 'Edit',
        href: `/admin/employees/${window.location.pathname.split('/').pop()}/edit`,
    },
];

interface RoleWithPermissions extends Role {
    permissions: Permission[];
}

interface EmployeesEditProps {
    employee: Employee;
    departments: Department[];
    roles: Role[];
    roles_with_permissions: RoleWithPermissions[];
    permissions: Permission[];
    employee_permissions: {
        granted: string[];
        denied: string[];
        effective: string[];
    };
    employee_roles: number[];
}

export default function EmployeesEdit(props: EmployeesEditProps) {
    const { 
        employee, 
        departments, 
        roles, 
        roles_with_permissions, 
        permissions, 
        employee_permissions,
        employee_roles 
    } = props;

    // Employee Information Form
    const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
    const employeeForm = useForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone ?? '',
        department_id: employee.department_id ? employee.department_id.toString() : (employee.department?.id?.toString() || ''),
    });

    // User Roles & Permissions Form
    const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
    const rolesForm = useForm({
        role_id: employee_roles.length > 0 ? employee_roles[0].toString() : '',
        permissions: employee_permissions.granted,
        denied_permissions: employee_permissions.denied,
    });

    const handleEmployeeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingEmployee(true);
        employeeForm.patch(`/admin/employees/${employee.id}`, {
            onSuccess: () => {
                setIsUpdatingEmployee(false);
            },
            onError: () => {
                setIsUpdatingEmployee(false);
            }
        });
    };

    const handleRolesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingRoles(true);
        rolesForm.patch(`/admin/employees/${employee.id}/roles`, {
            onSuccess: () => {
                setIsUpdatingRoles(false);
            },
            onError: () => {
                setIsUpdatingRoles(false);
            }
        });
    };

    const toggleRole = (roleId: string) => {
        rolesForm.setData('role_id', roleId);
    };

    const togglePermission = (permissionSlug: string, type: 'granted' | 'denied') => {
        if (type === 'granted') {
            const currentPermissions = rolesForm.data.permissions;
            const newPermissions = currentPermissions.includes(permissionSlug)
                ? currentPermissions.filter(p => p !== permissionSlug)
                : [...currentPermissions, permissionSlug];
            rolesForm.setData('permissions', newPermissions);
        } else {
            const currentDeniedPermissions = rolesForm.data.denied_permissions;
            const newDeniedPermissions = currentDeniedPermissions.includes(permissionSlug)
                ? currentDeniedPermissions.filter(p => p !== permissionSlug)
                : [...currentDeniedPermissions, permissionSlug];
            rolesForm.setData('denied_permissions', newDeniedPermissions);
        }
    };

    const getSelectedRole = () => {
        return roles_with_permissions.find(role => role.id.toString() === rolesForm.data.role_id);
    };

    const isPermissionGrantedByRole = (permissionSlug: string): boolean => {
        const selectedRole = getSelectedRole();
        return selectedRole?.permissions.some(p => p.slug === permissionSlug) || false;
    };

    const getModulePermissions = () => {
        const modulePermissions: Record<string, Permission[]> = {};
        permissions.forEach(permission => {
            if (!modulePermissions[permission.module]) {
                modulePermissions[permission.module] = [];
            }
            modulePermissions[permission.module].push(permission);
        });
        return modulePermissions;
    };
    
  
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Employee" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex flex-col items-start gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/employees">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Employees
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Employee</h1>
                        <p className="text-muted-foreground">
                            Update employee information and manage user permissions
                        </p>
                    </div>
                </div>

                {/* Employee Information Form */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Employee Information</CardTitle>
                        <CardDescription>
                            Update the basic information for this employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={employeeForm.data.name}
                                        onChange={(e) => employeeForm.setData('name', e.target.value)}
                                        placeholder="Enter name"
                                        required
                                    />
                                    {employeeForm.errors.name && (
                                        <p className="text-sm text-red-600">{employeeForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={employeeForm.data.email}
                                        onChange={(e) => employeeForm.setData('email', e.target.value)}
                                        placeholder="Enter email"
                                        required
                                    />
                                    {employeeForm.errors.email && (
                                        <p className="text-sm text-red-600">{employeeForm.errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={employeeForm.data.phone}
                                        onChange={(e) => employeeForm.setData('phone', e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                    {employeeForm.errors.phone && (
                                        <p className="text-sm text-red-600">{employeeForm.errors.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department_id">Department *</Label>
                                    <Select
                                        value={employeeForm.data.department_id}
                                        onValueChange={(value) => employeeForm.setData('department_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((department) => (
                                                <SelectItem key={department.id} value={department.id.toString()}>
                                                    {department.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {employeeForm.errors.department_id && (
                                        <p className="text-sm text-red-600">{employeeForm.errors.department_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isUpdatingEmployee}>
                                    {isUpdatingEmployee ? 'Updating...' : 'Update Employee Info'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* User Roles & Permissions Form */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>User Roles & Permissions</CardTitle>
                        <CardDescription>
                            Manage user roles and permission overrides
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRolesSubmit} className="space-y-6">
                            {/* Role Selection */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role_id">Role *</Label>
                                    <Select
                                        value={rolesForm.data.role_id}
                                        onValueChange={toggleRole}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id.toString()}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {rolesForm.errors.role_id && (
                                        <p className="text-sm text-red-600">{rolesForm.errors.role_id}</p>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-5">

                                    {rolesForm.data.role_id && getSelectedRole() && (
                                        <div className="space-y-2">
                                            <Label>Restricted Permissions</Label>
                                            <p className="text-sm text-gray-500">
                                                Check permissions to restrict from the selected role. These will be removed from the effective permissions.
                                            </p>
                                            <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-3">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm text-gray-700 border-b pb-1">
                                                        {getSelectedRole()?.name} - Restrict Permissions
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-1">
                                                        {getSelectedRole()?.permissions.map((permission) => {
                                                            const isDenied = rolesForm.data.denied_permissions.includes(permission.slug);
                                                            return (
                                                                <div key={permission.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`denied-${permission.id}`}
                                                                        checked={isDenied}
                                                                        onCheckedChange={() => togglePermission(permission.slug, 'denied')}
                                                                    />
                                                                    <Label 
                                                                        htmlFor={`denied-${permission.id}`} 
                                                                        className={`text-xs cursor-pointer ${
                                                                            isDenied ? 'text-red-700 font-medium' : 'text-gray-600'
                                                                        }`}
                                                                    >
                                                                        {permission.name} {
                                                                            isDenied ? '✓ Restricted' : '(Click to restrict)'
                                                                        }
                                                                    </Label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            {rolesForm.errors.denied_permissions && (
                                                <p className="text-sm text-red-600">{rolesForm.errors.denied_permissions}</p>
                                            )}
                                            
                                            {/* Show current denied permissions summary */}
                                            {rolesForm.data.denied_permissions.length > 0 && (
                                                <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                                                    <p className="text-sm text-red-800 font-medium">
                                                        Currently Restricted Permissions ({rolesForm.data.denied_permissions.length}):
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {rolesForm.data.denied_permissions.map((permissionSlug) => {
                                                            const permission = permissions.find(p => p.slug === permissionSlug);
                                                            return permission ? (
                                                                <Badge key={permission.id} variant="secondary" className="text-xs bg-red-100 text-red-800">
                                                                    {permission.name}
                                                                </Badge>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Additional Permissions */}
                                    <div className="space-y-2">
                                        <Label>Additional Permissions</Label>
                                        <p className="text-sm text-gray-500">
                                            Grant additional permissions beyond those provided by the role. Check to add, uncheck to remove.
                                        </p>
                                        <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-3">
                                            {Object.entries(getModulePermissions()).map(([module, modulePermissions]) => (
                                                <div key={module} className="space-y-2">
                                                    <h4 className="font-medium text-sm capitalize text-gray-700 border-b pb-1">
                                                        {module} Permissions
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-1">
                                                        {modulePermissions.map((permission) => {
                                                            const isGrantedByRole = isPermissionGrantedByRole(permission.slug);
                                                            const isAdditionalPermission = rolesForm.data.permissions.includes(permission.slug);
                                                            
                                                            return (
                                                                <div key={permission.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`permission-${permission.id}`}
                                                                        checked={isAdditionalPermission}
                                                                        onCheckedChange={() => togglePermission(permission.slug, 'granted')}
                                                                        disabled={isGrantedByRole}
                                                                    />
                                                                    <Label
                                                                        htmlFor={`permission-${permission.id}`}
                                                                        className={`text-xs cursor-pointer ${
                                                                            isGrantedByRole 
                                                                                ? 'text-gray-400 line-through' 
                                                                                : isAdditionalPermission 
                                                                                    ? 'text-green-700 font-medium' 
                                                                                    : 'text-gray-600'
                                                                        }`}
                                                                    >
                                                                        {permission.name} {
                                                                            isGrantedByRole 
                                                                                ? '(Granted by Role)' 
                                                                                : isAdditionalPermission 
                                                                                    ? '✓ Additional Permission' 
                                                                                    : '(Click to add)'
                                                                        }
                                                                    </Label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {rolesForm.errors.permissions && (
                                            <p className="text-sm text-red-600">{rolesForm.errors.permissions}</p>
                                        )}
                                        
                                        {/* Show current additional permissions summary */}
                                        {rolesForm.data.permissions.length > 0 && (
                                            <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                                                <p className="text-sm text-green-800 font-medium">
                                                    Current Additional Permissions ({rolesForm.data.permissions.length}):
                                                </p>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {rolesForm.data.permissions.map((permissionSlug) => {
                                                        const permission = permissions.find(p => p.slug === permissionSlug);
                                                        return permission ? (
                                                            <Badge key={permission.id} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                                {permission.name}
                                                            </Badge>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isUpdatingRoles}>
                                    {isUpdatingRoles ? 'Updating...' : 'Update Roles & Permissions'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}