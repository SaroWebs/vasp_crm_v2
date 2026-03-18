import { useState } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
    permissions: Array<{
        id: number;
        name: string;
        slug: string;
        module: string;
        action: string;
    }>;
    user_permissions: Array<{
        id: number;
        name: string;
        slug: string;
        module: string;
        action: string;
    }>;
    denied_permissions: Array<{
        id: number;
        name: string;
        slug: string;
        module: string;
        action: string;
    }>;
}

interface UserIndexProps {
    users: User[];
}

export default function UserIndex({ users: initialUsers }: UserIndexProps) {
    const [users, setUsers] = useState(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedbackMessage({ type, message });
        setTimeout(() => setFeedbackMessage(null), 5000);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setLoading(true);
        try {
            await axios.delete(`/admin/users/${userToDelete.id}`);
            setUsers(users.filter(user => user.id !== userToDelete.id));
            showFeedback('success', 'User deleted successfully');
            setShowDeleteDialog(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Failed to delete user:', error);
            showFeedback('error', 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const getUserPermissionCount = (user: User) => {
        const totalPermissions = new Set([
            ...user.permissions.map(p => p.id),
            ...user.user_permissions.map(p => p.id)
        ]);
        return totalPermissions.size;
    };

    const getUserLevelPermissionsCount = (user: User) => {
        return user.user_permissions.length + user.denied_permissions.length;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage users, roles, and individual permissions
                    </p>
                </div>
                <Link href="/admin/users/create">
                    <Button>Create User</Button>
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

            <Card>
                <CardHeader>
                    <CardTitle>All Users ({users.length})</CardTitle>
                    <CardDescription>
                        Users with their roles and user-level permissions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-4">
                        <Input
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    {/* Users Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Total Permissions</TableHead>
                                    <TableHead>User-Level Permissions</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map((role) => (
                                                        <Badge key={role.id} variant="secondary">
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                    {user.roles.length === 0 && (
                                                        <Badge variant="outline">No Role</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-center">
                                                    <div className="font-medium">{getUserPermissionCount(user)}</div>
                                                    <div className="text-xs text-muted-foreground">total</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-center">
                                                    <div className="font-medium">{getUserLevelPermissionsCount(user)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {user.user_permissions.length > 0 && `${user.user_permissions.length} granted`}
                                                        {user.user_permissions.length > 0 && user.denied_permissions.length > 0 && ', '}
                                                        {user.denied_permissions.length > 0 && `${user.denied_permissions.length} denied`}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            ⋮
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                                Edit User
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteClick(user)}
                                                        >
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}