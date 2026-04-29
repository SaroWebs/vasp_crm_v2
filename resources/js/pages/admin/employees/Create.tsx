import AppLayout from '@/layouts/app-layout';
import { Department, Permission, Role, type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';

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
        title: 'Create',
        href: '/admin/employees/create',
    },
];

interface RoleWithPermissions extends Role {
    permissions: Permission[];
}

interface EmployeesCreateProps {
    departments: Department[];
    roles: Role[];
    roles_with_permissions: RoleWithPermissions[];
    permissions: Permission[];
}

export default function EmployeesCreate(props: EmployeesCreateProps) {
    const { departments, roles, roles_with_permissions, permissions } = props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        code: '',
        password: '',
        password_confirmation: '',
        phone: '',
        department_id: '',
        role_id: '',
        permissions: [] as string[],
        denied_permissions: [] as string[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/employees');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />

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
                        <h1 className="text-3xl font-bold tracking-tight">Create Employee</h1>
                        <p className="text-muted-foreground">
                            Add a new employee to the system with user account and permissions
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="">
                    <div className="w-full space-y-6">
                        {/* User Information Form */}
                        <Card className="">
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                                <CardDescription>
                                    Create a new user account for the employee
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Shared Information */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter name"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Enter email"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="code">Employee Code</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            placeholder="e.g. EMP-1001"
                                        />
                                        {errors.code && (
                                            <p className="text-sm text-red-600">{errors.code}</p>
                                        )}
                                    </div>
                                </div>

                                {/* User-specific Information */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Enter password (min 8 characters)"
                                            required
                                        />
                                        <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                                        {errors.password && (
                                            <p className="text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Confirm Password *</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm password"
                                            required
                                        />
                                        {errors.password_confirmation && (
                                            <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-red-600">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department_id">Department *</Label>
                                        <Select
                                            value={data.department_id}
                                            onValueChange={(value) => setData('department_id', value)}
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
                                        {errors.department_id && (
                                            <p className="text-sm text-red-600">{errors.department_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role_id">Role *</Label>
                                        <Select
                                            value={data.role_id}
                                            onValueChange={(value) => setData('role_id', value)}
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
                                        {errors.role_id && (
                                            <p className="text-sm text-red-600">{errors.role_id}</p>
                                        )}
                                    </div>
                                </div>


                            </CardContent>
                        </Card>
                        {data.role_id ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                <Card className="">
                                    <CardHeader>
                                        <CardTitle>Role-Based Permissions</CardTitle>
                                        <CardDescription>
                                            Configure role assignment and role permission restrictions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Role Permissions for Blacklisting */}
                                        {data.role_id && roles_with_permissions && (
                                            <div className="space-y-2">
                                                <Label>Role Permission Restrictions</Label>
                                                <p className="text-xs text-gray-500">
                                                    Select permissions to deny from the selected role. These will override the role's default permissions.
                                                </p>
                                                <div className="max-h-48 overflow-y-auto border rounded p-4 space-y-3">
                                                    {(() => {
                                                        const selectedRole = roles_with_permissions.find(r => r.id.toString() === data.role_id);
                                                        if (!selectedRole || !selectedRole.permissions) return (
                                                            <p className="text-sm text-gray-500">No permissions found for this role.</p>
                                                        );

                                                        const rolePermissionsByModule = selectedRole.permissions.reduce((acc, permission) => {
                                                            if (!acc[permission.module]) acc[permission.module] = [];
                                                            acc[permission.module].push(permission);
                                                            return acc;
                                                        }, {} as Record<string, typeof selectedRole.permissions>);

                                                        return Object.entries(rolePermissionsByModule).map(([module, modulePermissions]) => (
                                                            <div key={module} className="space-y-2">
                                                                <h4 className="font-medium text-sm capitalize text-gray-700 border-b pb-1">
                                                                    {module} Permissions
                                                                </h4>
                                                                <div className="grid grid-cols-1 gap-1">
                                                                    {modulePermissions.map((permission) => (
                                                                        <div key={permission.id} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={`denied-${permission.id}`}
                                                                                checked={data.denied_permissions.includes(permission.slug)}
                                                                                onCheckedChange={(checked) => {
                                                                                    if (checked) {
                                                                                        setData('denied_permissions', [...data.denied_permissions, permission.slug]);
                                                                                    } else {
                                                                                        setData('denied_permissions', data.denied_permissions.filter(p => p !== permission.slug));
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Label htmlFor={`denied-${permission.id}`} className="text-xs text-red-700">
                                                                                {permission.name} (Deny)
                                                                            </Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                                {errors.denied_permissions && (
                                                    <p className="text-sm text-red-600">{errors.denied_permissions}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Role Permission Summary */}
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <h5 className="font-medium text-blue-900 mb-2">Role Permission Summary</h5>
                                            <div className="text-xs text-blue-800 space-y-1">
                                                <p>• <strong>Selected Role:</strong> {roles.find(r => r.id.toString() === data.role_id)?.name || 'Not selected'}</p>
                                                <p>• <strong>Total Role Permissions:</strong> {(() => {
                                                    if (!roles_with_permissions) return 0;
                                                    const selectedRole = roles_with_permissions.find(r => r.id.toString() === data.role_id);
                                                    return selectedRole && selectedRole.permissions ? selectedRole.permissions.length : 0;
                                                })()}</p>
                                                <p>• <strong>Denied Permissions:</strong> {data.denied_permissions.length}</p>
                                                <p>• <strong>Effective Role Permissions:</strong> {(() => {
                                                    if (!roles_with_permissions) return 0;
                                                    const selectedRole = roles_with_permissions.find(r => r.id.toString() === data.role_id);
                                                    const rolePermCount = selectedRole && selectedRole.permissions ? selectedRole.permissions.length : 0;
                                                    return rolePermCount - data.denied_permissions.length;
                                                })()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-orange-200 bg-orange-50">
                                    <CardHeader>
                                        <CardTitle className="text-orange-900">User-Specific Additional Permissions</CardTitle>
                                        <CardDescription className="text-orange-700">
                                            Grant additional permissions specific to this user that are not already assigned to their role
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-orange-900">Available Additional Permissions</Label>
                                            <p className="text-xs text-orange-600">
                                                Only permissions not already included in the selected role are shown here. These will be granted in addition to role permissions.
                                            </p>

                                            {(() => {
                                                // Get role permissions (excluding denied ones)
                                                const selectedRole = roles_with_permissions?.find(r => r.id.toString() === data.role_id);
                                                const rolePermissionSlugs = selectedRole?.permissions
                                                    ?.filter(permission => !data.denied_permissions.includes(permission.slug))
                                                    ?.map(permission => permission.slug) || [];

                                                // Filter out permissions that are already in the role
                                                const availableAdditionalPermissions = permissions.filter(permission =>
                                                    !rolePermissionSlugs.includes(permission.slug)
                                                );

                                                if (availableAdditionalPermissions.length === 0) {
                                                    return (
                                                        <div className="p-4 border border-orange-300 rounded bg-white text-center">
                                                            <p className="text-sm text-orange-600">
                                                                {data.role_id ?
                                                                    'All available permissions are already covered by the selected role.' :
                                                                    'Select a role to see additional permissions that can be granted.'}
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="max-h-48 overflow-y-auto border border-orange-300 rounded p-4 space-y-3 bg-white">
                                                        {Object.entries(
                                                            availableAdditionalPermissions.reduce((acc, permission) => {
                                                                if (!acc[permission.module]) acc[permission.module] = [];
                                                                acc[permission.module].push(permission);
                                                                return acc;
                                                            }, {} as Record<string, typeof availableAdditionalPermissions>)
                                                        ).map(([module, modulePermissions]) => (
                                                            <div key={module} className="space-y-2">
                                                                <h4 className="font-medium text-sm capitalize text-orange-800 border-b border-orange-200 pb-1">
                                                                    {module} Permissions
                                                                </h4>
                                                                <div className="grid grid-cols-1 gap-1">
                                                                    {modulePermissions.map((permission) => (
                                                                        <div key={permission.id} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={`permission-${permission.id}`}
                                                                                checked={data.permissions.includes(permission.slug)}
                                                                                onCheckedChange={(checked) => {
                                                                                    if (checked) {
                                                                                        setData('permissions', [...data.permissions, permission.slug]);
                                                                                    } else {
                                                                                        setData('permissions', data.permissions.filter(p => p !== permission.slug));
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Label htmlFor={`permission-${permission.id}`} className="text-xs text-orange-700 font-medium">
                                                                                {permission.name}
                                                                            </Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}

                                            {errors.permissions && (
                                                <p className="text-sm text-red-600">{errors.permissions}</p>
                                            )}
                                        </div>

                                        {/* User-Specific Permission Summary */}
                                        <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
                                            <h5 className="font-medium text-orange-900 mb-2">User-Specific Permission Summary</h5>
                                            <div className="text-xs text-orange-800 space-y-1">
                                                {(() => {
                                                    const selectedRole = roles_with_permissions?.find(r => r.id.toString() === data.role_id);
                                                    const rolePermissionSlugs = selectedRole?.permissions
                                                        ?.filter(permission => !data.denied_permissions.includes(permission.slug))
                                                        ?.map(permission => permission.slug) || [];

                                                    const availableAdditionalPermissions = permissions.filter(permission =>
                                                        !rolePermissionSlugs.includes(permission.slug)
                                                    );

                                                    return (
                                                        <>
                                                            <p>• <strong>Available Additional Permissions:</strong> {availableAdditionalPermissions.length}</p>
                                                            <p>• <strong>Currently Granted Additional:</strong> {data.permissions.length}</p>
                                                            <p>• <strong>Management:</strong> Independent of role system</p>
                                                            <p>• <strong>Effect:</strong> Added on top of effective role permissions</p>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null}

                        <div>
                            <div className="flex justify-end gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Employee & User Account'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/admin/employees">Cancel</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}