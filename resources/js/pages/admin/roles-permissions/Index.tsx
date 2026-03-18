import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import RoleCard from '@/components/roles/RoleCard';
import RoleModal from '@/components/roles/RoleModal';
import PermissionModal from '@/components/roles/PermissionModal';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    level: number;
    is_default: boolean;
    permissions: Permission[];
}

interface Props {
    roles: Role[];
    permissions: Record<string, Permission[]>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: '/admin/dashboard',
    },
    {
        title: 'Roles',
        href: '#',
    },
];

export default function Index({ roles, permissions }: Props) {
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | undefined>();
    const [viewingRole, setViewingRole] = useState<Role | undefined>();
    const [permissionModalMode, setPermissionModalMode] = useState<'view' | 'create' | 'edit'>('view');
    const [editingPermission, setEditingPermission] = useState<Permission | undefined>();


    const handleEditRole = (role?: Role) => {
        setEditingRole(role);
        setRoleModalOpen(true);
    };

    const handleCreateRole = () => {
        setEditingRole(undefined);
        setRoleModalOpen(true);
    };

    const handleCreatePermission = () => {
        setViewingRole(undefined);
        setEditingPermission(undefined);
        setPermissionModalMode('create');
        setPermissionModalOpen(true);
    };

    const handleEditPermission = (permission: Permission) => {
        setEditingPermission(permission);
        setPermissionModalMode('edit');
        setPermissionModalOpen(true);
    };

    const handleDeletePermission = (permission: Permission) => {
        if (confirm(`Are you sure you want to delete the permission "${permission.name}"?`)) {
            router.delete(`/admin/permissions/${permission.id}`, {
                onSuccess: () => {
                    // Permission will be automatically refreshed by inertia
                },
                onError: () => {
                    alert('Failed to delete permission. Please try again.');
                }
            });
        }
    };



    const closeModals = () => {
        setRoleModalOpen(false);
        setPermissionModalOpen(false);
        setEditingRole(undefined);
        setViewingRole(undefined);
        setEditingPermission(undefined);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles & Permissions" />

            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Roles</h2>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateRole}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Role
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            onEditRole={handleEditRole}
                        />
                    ))}
                </div>
            </div>
            <br />
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Permissions</h2>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreatePermission}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Permission
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {permissions && Object.keys(permissions).length > 0 ? (
                        Object.entries(permissions).map(([module, modulePermissions]) => (
                            <div key={module} className="border rounded-lg p-4 shadow-sm">
                                
                                <h3 className="font-medium text-base capitalize mb-2">{module}</h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {modulePermissions.length} permission{modulePermissions.length !== 1 ? 's' : ''}
                                </p>
                                
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {modulePermissions.map((permission: Permission) => (
                                        <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 border rounded">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{permission.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{permission.slug}</div>
                                                <Badge variant="secondary" className="text-xs mt-1">
                                                    {permission.action}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center space-x-1 ml-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditPermission(permission)}
                                                    className="p-1 h-auto text-blue-600 hover:text-blue-700"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeletePermission(permission)}
                                                    className="p-1 h-auto text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
                            <p>No permissions found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Role Modal */}
            <RoleModal
                open={roleModalOpen}
                role={editingRole}
                permissions={permissions}
                onClose={closeModals}
                mode={editingRole ? 'edit' : 'create'}
            />

            {/* Permission Modal */}
            <PermissionModal
                open={permissionModalOpen}
                role={viewingRole}
                permission={editingPermission}
                permissions={permissions}
                onClose={closeModals}
                mode={permissionModalMode}
            />
        </AppLayout>
    );
}