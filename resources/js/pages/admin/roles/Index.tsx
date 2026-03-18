import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Roles',
        href: '/admin/roles',
    },
];

interface RolesIndexProps {
    roles?: any[];
    filters?: any;
    userPermissions?: string[];
}

export default function RolesIndex(props: RolesIndexProps) {
    const {
        roles = [],
        filters = {},
        userPermissions = []
    } = props;

    
    const getLevelBadge = (level: number) => {
        const variants: Record<number, "default" | "secondary" | "destructive" | "outline"> = {
            1: 'outline',
            2: 'secondary',
            3: 'default'
        };

        const labels: Record<number, string> = {
            1: 'Basic',
            2: 'Manager', 
            3: 'Super Admin'
        };

        return (
            <Badge variant={variants[level] || 'secondary'}>
                {labels[level] || level}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                        <p className="text-muted-foreground">
                            Manage user roles and permissions
                        </p>
                    </div>
                    {userPermissions.includes('role.create') && (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roles.length}</div>
                            <p className="text-xs text-muted-foreground">
                                All user roles
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Role Hierarchy</CardTitle>
                            <CardDescription>
                                Role levels and structure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm">Super Admin (Level 3)</span>
                                    <span className="text-sm font-medium">
                                        {roles.filter(r => r.level === 3).length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Manager (Level 2)</span>
                                    <span className="text-sm font-medium">
                                        {roles.filter(r => r.level === 2).length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Basic (Level 1)</span>
                                    <span className="text-sm font-medium">
                                        {roles.filter(r => r.level === 1).length}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Role Assignment</CardTitle>
                            <CardDescription>
                                Users with roles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {roles.reduce((sum, r) => sum + (r.users?.length || 0), 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total role assignments
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Role List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Roles</CardTitle>
                        <CardDescription>
                            Complete list of system roles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {roles.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No roles found.
                                </p>
                            ) : (
                                roles.map((role) => (
                                    <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {role.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {role.slug} • {role.users?.length || 0} users
                                            </p>
                                            {role.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {getLevelBadge(role.level)}
                                            <span className="text-xs text-muted-foreground">
                                                {role.permissions?.length || 0} permissions
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}