import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
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
import { Alert } from '@/components/ui/alert';
import PermissionManagementModal from './PermissionManagementModal';

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

interface RoleModalProps {
    open: boolean;
    role?: Role;
    permissions: Record<string, Permission[]>;
    onClose: () => void;
    mode: 'create' | 'edit';
}

export default function RoleModal({ open, role, permissions, onClose, mode }: RoleModalProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Use Inertia's useForm hook for role details
    const form = useForm({
        name: role?.name || '',
        slug: role?.slug || '',
        description: role?.description || '',
        level: role?.level || 1,
    });

    // Helper function to show feedback
    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedbackMessage({ type, message });
    };

    useEffect(() => {
        if (open && mode === 'edit' && role) {
            form.setData({
                name: role.name,
                slug: role.slug,
                description: role.description || '',
                level: role.level,
            });
        } else if (open && mode === 'create') {
            form.setData({
                name: '',
                slug: '',
                description: '',
                level: 1,
            });
        }
    }, [open, mode, role]);

    const isEdit = mode === 'edit';
    const title = isEdit ? 'Manage Role' : 'Create Role';
    const description = isEdit ? 'Make changes to the role details below.' : 'Create a new role with the details below.';

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && role) {
            axios.patch(`/admin/roles/${role.id}`, form.data)
                .then(() => {
                    showFeedback('success', 'Role updated successfully!');
                    setTimeout(() => onClose(), 1500);
                })
                .catch((error) => {
                    console.error('Role update failed:', error);
                    const message = error.response?.data?.message || 'Failed to update role. Please check your inputs.';
                    showFeedback('error', message);
                });
        } else {
            axios.post('/admin/roles', form.data)
                .then(() => {
                    showFeedback('success', 'Role created successfully!');
                    setTimeout(() => onClose(), 1500);
                })
                .catch((error) => {
                    console.error('Role creation failed:', error);
                    const message = error.response?.data?.message || 'Failed to create role. Please check your inputs.';
                    showFeedback('error', message);
                });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[98vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                        {role ? (
                            <div className="text-sm text-yellow-600 mt-2">
                                You are editing <span className='font-semibold uppercase'>{role.name}</span> with {role.permissions.length} permissions.
                            </div>
                        ) : null}
                    </DialogHeader>

                    <form onSubmit={handleRoleSubmit} className="space-y-6">
                        {/* Feedback Message */}
                        {feedbackMessage && (
                            <Alert className={`${feedbackMessage.type === 'error'
                                ? 'border-red-200 bg-red-50 text-red-800'
                                : 'border-green-200 bg-green-50 text-green-800'
                                } relative`}>
                                <div className="flex justify-between items-center">
                                    <span>{feedbackMessage.message}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFeedbackMessage(null)}
                                        className="h-auto p-1 hover:bg-transparent"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </Alert>
                        )}

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    ref={nameInput}
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Role name"
                                    autoComplete="off"
                                    autoFocus
                                />
                                {form.errors.name && (
                                    <p className="text-sm text-red-600">{form.errors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    value={form.data.slug}
                                    onChange={(e) => form.setData('slug', e.target.value)}
                                    placeholder="role-slug"
                                    autoComplete="off"
                                />
                                {form.errors.slug && (
                                    <p className="text-sm text-red-600">{form.errors.slug}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Role description"
                                    autoComplete="off"
                                />
                                {form.errors.description && (
                                    <p className="text-sm text-red-600">{form.errors.description}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="level">Level</Label>
                                <Input
                                    id="level"
                                    name="level"
                                    type="number"
                                    value={form.data.level}
                                    onChange={(e) => form.setData('level', parseInt(e.target.value) || 1)}
                                    placeholder="1"
                                    autoComplete="off"
                                    min="1"
                                />
                                {form.errors.level && (
                                    <p className="text-sm text-red-600">{form.errors.level}</p>
                                )}
                            </div>
                        </div>

                        {/* Permission Management Button for Edit Mode */}
                        {isEdit && role && (
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium">Permissions</h3>
                                        <p className="text-sm text-muted-foreground">
                                            This role currently has {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => setShowPermissionModal(true)}
                                        variant="outline"
                                    >
                                        Manage Permissions
                                    </Button>
                                </div>
                                
                                {role.permissions.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex flex-wrap gap-2">
                                            {role.permissions.slice(0, 5).map((permission) => (
                                                <Badge key={permission.id} variant="secondary">
                                                    {permission.name}
                                                </Badge>
                                            ))}
                                            {role.permissions.length > 5 && (
                                                <Badge variant="outline">
                                                    +{role.permissions.length - 5} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                form.clearErrors();
                                onClose();
                            }}
                        >
                            Close
                        </Button>
                        <Button type="submit" disabled={form.processing} onClick={handleRoleSubmit}>
                            {isEdit ? 'Update Role' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permission Management Modal */}
            {role && (
                <PermissionManagementModal
                    open={showPermissionModal}
                    role={role}
                    permissions={permissions}
                    onClose={() => setShowPermissionModal(false)}
                />
            )}
        </>
    );
}