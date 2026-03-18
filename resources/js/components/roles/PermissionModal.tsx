import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface PermissionModalProps {
    open: boolean;
    role?: Role;
    permission?: Permission;
    permissions: Record<string, Permission[]>;
    onClose: () => void;
    mode: 'view' | 'create' | 'edit';
}

export default function PermissionModal({ open, role, permission, permissions, onClose, mode }: PermissionModalProps) {
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

    const isView = mode === 'view';
    const isCreate = mode === 'create';
    const isEdit = mode === 'edit';

    const title = isView && role ? `Permissions for ${role?.name}` : isCreate ? 'Create Permission' : 'Edit Permission';
    const description = isView && role
        ? `View and manage permissions for the ${role?.name} role.`
        : isCreate 
        ? 'Create a new permission with the details below.'
        : 'Make changes to the permission details below.';

    const allPermissions = Object.entries(permissions || {});

    useEffect(() => {
        if (isCreate && !editingPermission) {
            setEditingPermission({
                id: 0,
                name: '',
                slug: '',
                module: '',
                action: '',
                description: '',
            });
        } else if (isEdit && permission) {
            setEditingPermission(permission);
        }
    }, [isCreate, isEdit, permission, editingPermission]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData);
        
        if (isCreate) {
            router.post('/admin/permissions', data);
        } else if (isEdit && editingPermission) {
            router.put(`/admin/permissions/${editingPermission.id}`, data);
        }
        onClose();
    };

    const groupedPermissions = isView && role 
        ? role.permissions.reduce((acc, permission) => {
            if (!acc[permission.module]) {
                acc[permission.module] = [];
            }
            acc[permission.module].push(permission);
            return acc;
        }, {} as Record<string, Permission[]>)
        : permissions || {};

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {isView && role ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">{role.name}</h3>
                                <p className="text-sm text-muted-foreground">{role.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Badge variant="secondary">Level {role.level}</Badge>
                                <span className="text-sm text-muted-foreground">
                                    {role.permissions.length} permissions
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-4 max-h-96 overflow-y-auto">
                            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                                <Card key={module}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base capitalize">{module}</CardTitle>
                                        <CardDescription>
                                            {modulePermissions.length} permission{modulePermissions.length !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {modulePermissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{permission.name}</div>
                                                    <div className="text-xs text-muted-foreground">{permission.slug}</div>
                                                    {permission.description && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {permission.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="ml-2">
                                                    {permission.action}
                                                </Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}

                            {role.permissions.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>This role has no permissions assigned.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(isCreate || isEdit) && (
                            <div className="border-t pt-4">
                                <h4 className="text-md font-medium mb-4">
                                    {isCreate ? 'Create New Permission' : 'Edit Permission'}
                                </h4>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                defaultValue={editingPermission?.name}
                                                placeholder="Permission name"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="slug">Slug</Label>
                                            <Input
                                                id="slug"
                                                name="slug"
                                                defaultValue={editingPermission?.slug}
                                                placeholder="permission-slug"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="module">Module</Label>
                                            <Input
                                                id="module"
                                                name="module"
                                                defaultValue={editingPermission?.module}
                                                placeholder="module-name"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="action">Action</Label>
                                            <Input
                                                id="action"
                                                name="action"
                                                defaultValue={editingPermission?.action}
                                                placeholder="create|read|update|delete"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Input
                                                id="description"
                                                name="description"
                                                defaultValue={editingPermission?.description}
                                                placeholder="Permission description"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                setEditingPermission(null);
                                                onClose();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {isEdit ? 'Update Permission' : 'Create Permission'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}