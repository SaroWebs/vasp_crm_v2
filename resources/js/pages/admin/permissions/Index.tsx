import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, Settings } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Permissions',
        href: '/admin/permissions',
    },
];

interface PermissionsIndexProps {
    permissions?: Permission[];
    filters?: any;
    userPermissions?: string[];
}

export default function PermissionsIndex(props: PermissionsIndexProps) {
    const { permissions = [], filters = {}, userPermissions = [] } = props;

    console.log(props);

    const getModuleBadge = (module: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            user: 'default',
            role: 'secondary',
            department: 'outline',
            ticket: 'default',
            task: 'secondary',
            client: 'outline',
            product: 'default',
        };

        return (
            <Badge variant={variants[module] || 'secondary'}>{module}</Badge>
        );
    };

    const getActionBadge = (action: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            create: 'default',
            read: 'secondary',
            update: 'outline',
            delete: 'destructive',
        };

        return (
            <Badge variant={variants[action] || 'secondary'}>{action}</Badge>
        );
    };

    // Group permissions by module
    const groupedPermissions = permissions.reduce(
        (acc, permission) => {
            const module = permission.module;
            if (!acc[module]) {
                acc[module] = [];
            }
            acc[module].push(permission);
            return acc;
        },
        {} as Record<string, Permission[]>,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Permissions
                        </h1>
                        <p className="text-muted-foreground">
                            Manage system permissions and access control
                        </p>
                    </div>
                    {userPermissions.includes('permission.create') && (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Permission
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Permissions
                            </CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {permissions.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All system permissions
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permission Modules</CardTitle>
                            <CardDescription>
                                Different system modules
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.keys(groupedPermissions).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permission Actions</CardTitle>
                            <CardDescription>Available actions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {['create', 'read', 'update', 'delete'].map(
                                    (action) => (
                                        <div
                                            key={action}
                                            className="flex justify-between text-sm"
                                        >
                                            <span className="capitalize">
                                                {action}
                                            </span>
                                            <span className="font-medium">
                                                {
                                                    permissions.filter(
                                                        (p) =>
                                                            p.action === action,
                                                    ).length
                                                }
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Role Assignments</CardTitle>
                            <CardDescription>
                                Permissions assigned to roles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {permissions.reduce(
                                    (sum, p) => sum + (p.roles?.length || 0),
                                    0,
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total assignments
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Permission List by Module */}
                <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(
                        ([module, modulePermissions]) => (
                            <Card key={module}>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <span>
                                            {module.charAt(0).toUpperCase() +
                                                module.slice(1)}{' '}
                                            Module
                                        </span>
                                        {getModuleBadge(module)}
                                    </CardTitle>
                                    <CardDescription>
                                        {modulePermissions.length} permissions
                                        in {module} module
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {modulePermissions.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className="flex items-center justify-between rounded border p-3"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {permission.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {permission.slug}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getActionBadge(
                                                        permission.action,
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        {permission.roles
                                                            ?.length || 0}{' '}
                                                        roles
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ),
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
