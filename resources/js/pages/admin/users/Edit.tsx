import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    permissions: Permission[];
}

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: Role[];
    permissions: Permission[];
    user_permissions: Permission[];
    denied_permissions: Permission[];
}

interface EditUserProps {
    user: User;
    all_permissions: Record<string, Permission[]>;
}

export default function EditUser({ user: initialUser, all_permissions }: EditUserProps) {
    const id  = 1; // get from url
    const [user, setUser] = useState(initialUser);
    const [formData, setFormData] = useState({
        name: initialUser.name,
        email: initialUser.email,
        password: '',
        password_confirmation: '',
    });
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
        initialUser.roles.map(role => role.id)
    );
    const [loading, setLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // User permission management state
    const [selectedUserPermissions, setSelectedUserPermissions] = useState<number[]>(
        initialUser.user_permissions.map(p => p.id)
    );
    const [selectedDeniedPermissions, setSelectedDeniedPermissions] = useState<number[]>(
        initialUser.denied_permissions.map(p => p.id)
    );
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedbackMessage({ type, message });
        setTimeout(() => setFeedbackMessage(null), 5000);
    };

    const getUserEffectivePermissions = () => {
        const grantedIds = new Set([...selectedUserPermissions]);
        const deniedIds = new Set(selectedDeniedPermissions);
        const rolePermissionIds = new Set(
            user.roles.flatMap(role => role.permissions.map(p => p.id))
        );

        // Start with role permissions
        const effectivePermissions: Permission[] = [];

        // Add role permissions that aren't denied
        user.roles.forEach(role => {
            role.permissions.forEach(permission => {
                if (!deniedIds.has(permission.id) && !effectivePermissions.find(p => p.id === permission.id)) {
                    effectivePermissions.push(permission);
                }
            });
        });

        // Add explicitly granted permissions
        const allPermissions = Object.values(all_permissions).flat();
        allPermissions.forEach(permission => {
            if (grantedIds.has(permission.id) && !effectivePermissions.find(p => p.id === permission.id)) {
                effectivePermissions.push(permission);
            }
        });

        return effectivePermissions.sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name));
    };

    const effectivePermissions = getUserEffectivePermissions();

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await axios.patch(`/admin/users/${id}`, formData);
            showFeedback('success', 'User updated successfully');
            // redirect to /admin/users
        } catch (error: any) {
            console.error('Failed to update user:', error);
            showFeedback('error', error.response?.data?.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleAssignment = async () => {
        setLoading(true);
        try {
            await axios.post(`/admin/users/${id}/roles`, { role_ids: selectedRoleIds });
            showFeedback('success', 'Roles updated successfully');
            // Reload the page to get updated data
            window.location.reload();
        } catch (error: any) {
            console.error('Failed to update roles:', error);
            showFeedback('error', error.response?.data?.message || 'Failed to update roles');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkPermissionUpdate = async () => {
        setLoading(true);
        try {
            await axios.post(`/admin/users/${id}/permissions/bulk-manage`, {
                permissions_to_grant: selectedUserPermissions.filter(
                    id => !user.user_permissions.find(p => p.id === id)
                ),
                permissions_to_deny: selectedDeniedPermissions.filter(
                    id => !user.denied_permissions.find(p => p.id === id)
                ),
                permissions_to_revoke: [
                    ...user.user_permissions.filter(p => !selectedUserPermissions.includes(p.id)).map(p => p.id),
                    ...user.denied_permissions.filter(p => !selectedDeniedPermissions.includes(p.id)).map(p => p.id),
                ],
            });
            showFeedback('success', 'User permissions updated successfully');
            window.location.reload();
        } catch (error: any) {
            console.error('Failed to update user permissions:', error);
            showFeedback('error', error.response?.data?.message || 'Failed to update user permissions');
        } finally {
            setLoading(false);
        }
    };

    const getAvailablePermissions = () => {
        const available: Record<string, Permission[]> = {};
        Object.entries(all_permissions).forEach(([module, modulePermissions]) => {
            available[module] = modulePermissions.filter(permission =>
                !selectedUserPermissions.includes(permission.id) &&
                !selectedDeniedPermissions.includes(permission.id)
            );
        });
        return available;
    };

    const availablePermissions = getAvailablePermissions();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
                    <p className="text-muted-foreground">
                        Manage user information, roles, and individual permissions
                    </p>
                </div>
                <Link href="/admin/users">
                    <Button variant="secondary">Back to Users</Button>
                </Link>
            </div>

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

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="permissions">User Permissions</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update the user's basic information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password (leave blank to keep current)</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={formData.password_confirmation}
                                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Assignment</CardTitle>
                            <CardDescription>
                                Assign roles to the user. When a role is assigned, all its permissions are automatically applied.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Roles</Label>
                                <Select
                                    value={selectedRoleIds.length > 0 ? selectedRoleIds[0]?.toString() : ''}
                                    onValueChange={(value) => {
                                        const roleId = parseInt(value);
                                        if (selectedRoleIds.includes(roleId)) {
                                            setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
                                        } else {
                                            setSelectedRoleIds([...selectedRoleIds, roleId]);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select roles..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* This would need to be populated from the server */}
                                        <SelectItem value="1">Administrator</SelectItem>
                                        <SelectItem value="2">Manager</SelectItem>
                                        <SelectItem value="3">User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Current Roles</Label>
                                <div className="flex flex-wrap gap-2">
                                    {user.roles.map((role) => (
                                        <Badge key={role.id} variant="secondary">
                                            {role.name}
                                        </Badge>
                                    ))}
                                    {user.roles.length === 0 && (
                                        <span className="text-muted-foreground">No roles assigned</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleRoleAssignment} disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Roles'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* User Permissions Tab */}
                <TabsContent value="permissions">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>User-Level Permissions</CardTitle>
                                <CardDescription>
                                    Grant, deny, or revoke individual permissions for this user. User-level permissions override role permissions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Granted Permissions */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Explicitly Granted Permissions</h4>
                                        <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                                            {user.user_permissions.length === 0 ? (
                                                <p className="text-muted-foreground text-center py-4">No explicitly granted permissions</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {user.user_permissions.map((permission) => (
                                                        <div key={permission.id} className="flex items-center justify-between p-2 bg-green-50 border rounded">
                                                            <span className="text-sm">{permission.name}</span>
                                                            <Badge variant="secondary">{permission.module}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Denied Permissions */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Explicitly Denied Permissions</h4>
                                        <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                                            {user.denied_permissions.length === 0 ? (
                                                <p className="text-muted-foreground text-center py-4">No explicitly denied permissions</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {user.denied_permissions.map((permission) => (
                                                        <div key={permission.id} className="flex items-center justify-between p-2 bg-red-50 border rounded">
                                                            <span className="text-sm">{permission.name}</span>
                                                            <Badge variant="secondary">{permission.module}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
                                        <DialogTrigger asChild>
                                            <Button>Manage User Permissions</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-5xl max-h-[98vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Manage User Permissions - {user.name}</DialogTitle>
                                                <DialogDescription>
                                                    Grant, deny, or revoke individual permissions for this user.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Available Permissions */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-medium">Available Permissions</h4>
                                                        <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                                                            {Object.entries(availablePermissions).map(([module, permissions]) => (
                                                                permissions.length > 0 && (
                                                                    <div key={module} className="space-y-2">
                                                                        <h5 className="font-medium text-sm uppercase text-muted-foreground">{module}</h5>
                                                                        {permissions.map((permission) => (
                                                                            <div key={permission.id} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    checked={selectedUserPermissions.includes(permission.id)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        if (checked) {
                                                                                            setSelectedUserPermissions([...selectedUserPermissions, permission.id]);
                                                                                            setSelectedDeniedPermissions(selectedDeniedPermissions.filter(id => id !== permission.id));
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <span className="text-sm">{permission.name}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Deny Permissions */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-medium">Deny Permissions</h4>
                                                        <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                                                            {Object.entries(availablePermissions).map(([module, permissions]) => (
                                                                permissions.length > 0 && (
                                                                    <div key={module} className="space-y-2">
                                                                        <h5 className="font-medium text-sm uppercase text-muted-foreground">{module}</h5>
                                                                        {permissions.map((permission) => (
                                                                            <div key={permission.id} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    checked={selectedDeniedPermissions.includes(permission.id)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        if (checked) {
                                                                                            setSelectedDeniedPermissions([...selectedDeniedPermissions, permission.id]);
                                                                                            setSelectedUserPermissions(selectedUserPermissions.filter(id => id !== permission.id));
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <span className="text-sm">{permission.name}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Current Overrides */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium">Grant These Permissions</h4>
                                                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                                                            {selectedUserPermissions.map((permissionId) => {
                                                                const allPerms = Object.values(all_permissions).flat();
                                                                const permission = allPerms.find(p => p.id === permissionId);
                                                                return permission ? (
                                                                    <div key={permissionId} className="flex items-center justify-between text-sm">
                                                                        <span>{permission.name}</span>
                                                                        <Badge variant="secondary">{permission.module}</Badge>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                            {selectedUserPermissions.length === 0 && (
                                                                <p className="text-muted-foreground">No permissions selected to grant</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h4 className="font-medium">Deny These Permissions</h4>
                                                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                                                            {selectedDeniedPermissions.map((permissionId) => {
                                                                const allPerms = Object.values(all_permissions).flat();
                                                                const permission = allPerms.find(p => p.id === permissionId);
                                                                return permission ? (
                                                                    <div key={permissionId} className="flex items-center justify-between text-sm">
                                                                        <span>{permission.name}</span>
                                                                        <Badge variant="secondary">{permission.module}</Badge>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                            {selectedDeniedPermissions.length === 0 && (
                                                                <p className="text-muted-foreground">No permissions selected to deny</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => setShowPermissionModal(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleBulkPermissionUpdate}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Updating...' : 'Update Permissions'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Effective Permissions Display */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Effective Permissions</CardTitle>
                                <CardDescription>
                                    All permissions this user currently has (role permissions + user-level grants, minus user-level denials)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                                    {effectivePermissions.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No effective permissions</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {Object.entries(
                                                effectivePermissions.reduce((acc, permission) => {
                                                    if (!acc[permission.module]) acc[permission.module] = [];
                                                    acc[permission.module].push(permission);
                                                    return acc;
                                                }, {} as Record<string, Permission[]>)
                                            ).map(([module, permissions]) => (
                                                <div key={module} className="space-y-2">
                                                    <h5 className="font-medium text-sm uppercase text-muted-foreground">{module}</h5>
                                                    {permissions.map((permission) => (
                                                        <div key={permission.id} className="flex items-center justify-between p-2 bg-background border rounded">
                                                            <span className="text-sm">{permission.name}</span>
                                                            <Badge variant="secondary">{permission.action}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}