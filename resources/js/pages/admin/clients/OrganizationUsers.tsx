import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client, type OrganizationUser } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowLeft, Plus, Pencil, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';

interface OrganizationUsersProps {
    client: Client;
    organizationUsers: OrganizationUser[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canRead: boolean;
}

interface OrganizationUserFormData {
    name: string;
    email: string;
    designation: string;
    phone: string;
    status: 'active' | 'inactive';
}

export default function OrganizationUsers(props: OrganizationUsersProps) {
    const { client, organizationUsers = [], canCreate, canEdit, canDelete, canRead } = props;
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Clients', href: '/admin/clients' },
        { title: client.name, href: `/admin/clients/${client.id}` },
        { title: 'Client Users', href: '' },
    ];

    const { data, setData, post, patch, processing, errors, reset } = useForm<OrganizationUserFormData>({
        name: '',
        email: '',
        designation: '',
        phone: '',
        status: 'active',
    });

    const stats = useMemo(() => {
        const total = organizationUsers.length;
        const active = organizationUsers.filter((u) => u.status === 'active').length;
        const inactive = organizationUsers.filter((u) => u.status === 'inactive').length;
        return { total, active, inactive };
    }, [organizationUsers]);

    const startEdit = (user: OrganizationUser) => {
        setEditingUserId(user.id);
        setData({
            name: user.name ?? '',
            email: user.email ?? '',
            designation: user.designation ?? '',
            phone: user.phone ?? '',
            status: user.status ?? 'active',
        });
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        reset();
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (editingUserId) {
            patch(`/admin/clients/${client.id}/organization-users/${editingUserId}`, {
                onSuccess: () => {
                    setEditingUserId(null);
                    reset();
                },
            });
            return;
        }

        post(`/admin/clients/${client.id}/organization-users`, {
            onSuccess: () => {
                reset();
            },
        });
    };

    const handleDelete = (userId: number) => {
        if (!confirm('Delete this organization user?')) {
            return;
        }

        setDeletingUserId(userId);
        router.delete(`/admin/clients/${client.id}/organization-users/${userId}`, {
            onFinish: () => setDeletingUserId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Client Users - ${client.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Client Users</h1>
                        <p className="text-muted-foreground">
                            Manage users for {client.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canRead && (
                            <Button variant="outline" asChild>
                            <Link href={`/admin/clients/${client.id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Client
                            </Link>
                        </Button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.inactive}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form */}
                {(canCreate || (canEdit && editingUserId)) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingUserId ? 'Edit User' : 'Add New User'}</CardTitle>
                            <CardDescription>
                                {editingUserId ? 'Update details for this client user' : 'Create a new client user'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Full name"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Email address"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="designation">Designation</Label>
                                        <Input
                                            id="designation"
                                            value={data.designation}
                                            onChange={(e) => setData('designation', e.target.value)}
                                            placeholder="Role / title"
                                        />
                                        {errors.designation && (
                                            <p className="text-sm text-red-600">{errors.designation}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="Phone number"
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-red-600">{errors.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(value: 'active' | 'inactive') => setData('status', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && (
                                            <p className="text-sm text-red-600">{errors.status}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button type="submit" disabled={processing}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {processing ? 'Saving...' : editingUserId ? 'Update User' : 'Add User'}
                                    </Button>
                                    {editingUserId && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Users List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users ({organizationUsers.length})</CardTitle>
                        <CardDescription>
                            All client users for this client
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {organizationUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No client users yet.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {organizationUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                                    {user.status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {user.designation || 'No designation'} • {user.email || 'No email'} • {user.phone || 'No phone'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {canEdit && (
                                                <Button variant="outline" size="sm" onClick={() => startEdit(user)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={deletingUserId === user.id}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
