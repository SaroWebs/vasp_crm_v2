import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, User, Mail, Phone, Building } from 'lucide-react';
import EmployeeTaskProgress from '@/components/admin/employees/EmployeeTaskProgress';

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
        title: 'View',
        href: '/admin/employees/show',
    },
];

interface Employee {
    id: number;
    name: string;
    email: string;
    code: string | null;
    phone: string | null;
    department: {
        id: number;
        name: string;
        description: string | null;
    };
    user: {
        id: number;
        name: string;
        email: string;
    };
    created_at: string;
    updated_at: string;
}

interface EmployeesShowProps {
    employee: Employee;
    userPermissions: string[];
}

export default function EmployeesShow(props: EmployeesShowProps) {
    const { employee, userPermissions = [] } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee: ${employee.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col items-start gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/employees">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Employees
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                            <p className="text-muted-foreground">
                                Employee details and information
                            </p>
                        </div>
                    </div>

                    {userPermissions.includes('employee.update') && (
                        <Button asChild>
                            <Link href={`/admin/employees/${employee.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Employee
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Employee Information */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                <p className="text-lg">{employee.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <p className="text-lg flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {employee.email}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Employee Code</label>
                                <p className="text-lg font-mono">{employee.code || '---'}</p>
                            </div>
                            {employee.phone && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                    <p className="text-lg flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {employee.phone}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Department Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Department Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Department</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{employee.department.name}</Badge>
                                </div>
                            </div>
                            {employee.department.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="text-sm mt-1">{employee.department.description}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Associated User</label>
                                <p className="text-lg mt-1">{employee.user.name}</p>
                                <p className="text-sm text-muted-foreground">{employee.user.email}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Employee Progress */}
                <EmployeeTaskProgress employeeId={employee.id} />

                {/* Timestamps */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timestamps</CardTitle>
                        <CardDescription>
                            Creation and modification dates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                <p className="text-lg">
                                    {new Date(employee.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                <p className="text-lg">
                                    {new Date(employee.updated_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
