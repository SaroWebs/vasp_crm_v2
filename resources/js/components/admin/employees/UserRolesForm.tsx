import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    slug: string;
}

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
}

interface RoleWithPermissions extends Role {
    permissions: Permission[];
}

interface UserRolesFormProps {
    employee: {
        id: number;
        user?: {
            id: number;
        };
    };
    roles: Role[];
    roles_with_permissions: RoleWithPermissions[];
    permissions: Permission[];
    employee_permissions: {
        granted: string[];
        denied: string[];
        effective: string[];
    };
    employee_roles: number[];
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

export default function UserRolesForm({
    employee,
    roles,
    roles_with_permissions,
    permissions,
    employee_permissions,
    employee_roles,
    onSuccess,
    onError,
}: UserRolesFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, patch, errors } = useForm({
        role_ids: employee_roles.map(id => id.toString()),
        permissions: employee_permissions.granted,
        denied_permissions: employee_permissions.denied,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await patch(`/admin/employees/${employee.id}`, {
                onSuccess: () => {
                    onSuccess?.();
                },
                onError: (err) => {
                    onError?.(err);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            setIsSubmitting(false);
        }
    };

    const toggleRole = (roleId: string) => {
        const currentRoles = data.role_ids;
        const newRoles = currentRoles.includes(roleId)
            ? currentRoles.filter(id => id !== roleId)
            : [...currentRoles, roleId];
        setData('role_ids', newRoles);
    };

    const togglePermission = (permissionSlug: string, type: 'granted' | 'denied') => {
        if (type === 'granted') {
            const newPermissions = data.permissions.includes(permissionSlug)
                ? data.permissions.filter(p => p !== permissionSlug)
                : [...data.permissions, permissionSlug];
            setData('permissions', newPermissions);
        } else {
            const newDeniedPermissions = data.denied_permissions.includes(permissionSlug)
                ? data.denied_permissions.filter(p => p !== permissionSlug)
                : [...data.denied_permissions, permissionSlug];
            setData('denied_permissions', newDeniedPermissions);
        }
    };

    const getSelectedRoles = () => {
        return roles_with_permissions.filter(role => data.role_ids.includes(role.id.toString()));
    };

    const getRolePermissionSlugs = (roleId: string): string[] => {
        const role = roles_with_permissions.find(r => r.id.toString() === roleId);
        return role?.permissions.map(p => p.slug) || [];
    };

    const isPermissionGrantedByRole = (permissionSlug: string): boolean => {
        return getSelectedRoles().some(role => 
            role.permissions.some(p => p.slug === permissionSlug)
        );
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
        <Card>
            <CardHeader>
                <CardTitle>User Roles & Permissions</CardTitle>
                <CardDescription>
                    Manage user roles and permission overrides for this employee
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Roles</Label>
                            <p className="text-sm text-gray-500">
                                Select one or more roles for this user. Multiple roles will be combined.
                            </p>
                            <div className="border rounded p-4 space-y-3">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={data.role_ids.includes(role.id.toString())}
                                            onCheckedChange={() => toggleRole(role.id.toString())}
                                        />
                                        <Label htmlFor={`role-${role.id}`} className="text-sm font-medium">
                                            {role.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.role_ids && (
                                <p className="text-sm text-red-600">{errors.role_ids}</p>
                            )}
                        </div>

                        {/* Show permissions from selected roles */}
                        {data.role_ids.length > 0 && (
                            <div className="space-y-2">
                                <Label>Permissions from Selected Roles</Label>
                                <p className="text-sm text-gray-500">
                                    These permissions are granted through the selected roles. You can restrict specific permissions below.
                                </p>
                                <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-3">
                                    {getSelectedRoles().map((role) => (
                                        <div key={role.id} className="space-y-2">
                                            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">
                                                {role.name} Permissions
                                            </h4>
                                            <div className="grid grid-cols-1 gap-1">
                                                {role.permissions.map((permission) => (
                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            checked={!data.denied_permissions.includes(permission.slug)}
                                                            disabled
                                                        />
                                                        <Label className="text-xs text-green-700">
                                                            {permission.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Restricted Permissions from Roles */}
                        {data.role_ids.length > 0 && (
                            <div className="space-y-2">
                                <Label>Restricted Permissions</Label>
                                <p className="text-sm text-gray-500">
                                    Select permissions to restrict from the selected roles. These will be removed from the effective permissions.
                                </p>
                                <div className="max-h-60 overflow-y-auto border rounded p-4 space-y-3">
                                    {getSelectedRoles().map((role) => (
                                        <div key={role.id} className="space-y-2">
                                            <h4 className="font-medium text-sm text-gray-700 border-b pb-1">
                                                {role.name} - Restrict Permissions
                                            </h4>
                                            <div className="grid grid-cols-1 gap-1">
                                                {role.permissions.map((permission) => (
                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`denied-${permission.id}`}
                                                            checked={data.denied_permissions.includes(permission.slug)}
                                                            onCheckedChange={() => togglePermission(permission.slug, 'denied')}
                                                        />
                                                        <Label htmlFor={`denied-${permission.id}`} className="text-xs text-red-700">
                                                            {permission.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.denied_permissions && (
                                    <p className="text-sm text-red-600">{errors.denied_permissions}</p>
                                )}
                            </div>
                        )}

                        {/* Additional Permissions */}
                        <div className="space-y-2">
                            <Label>Additional Permissions</Label>
                            <p className="text-sm text-gray-500">
                                Grant additional permissions beyond those provided by roles.
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
                                                const isAdditionalPermission = data.permissions.includes(permission.slug);
                                                
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
                                                            className={`text-xs ${
                                                                isGrantedByRole 
                                                                    ? 'text-gray-400 line-through' 
                                                                    : 'text-green-700'
                                                            }`}
                                                        >
                                                            {permission.name} {
                                                                isGrantedByRole 
                                                                    ? '(Granted by Role)' 
                                                                    : isAdditionalPermission 
                                                                        ? '(Additional Permission)' 
                                                                        : ''
                                                            }
                                                        </Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.permissions && (
                                <p className="text-sm text-red-600">{errors.permissions}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Roles & Permissions'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}