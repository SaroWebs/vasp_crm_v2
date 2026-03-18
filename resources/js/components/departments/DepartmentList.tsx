import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { Department } from '@/types';

interface DepartmentListProps {
    departments: {
        data?: Department[];
        total?: number;
        current_page?: number;
        last_page?: number;
    };
    selectedDepartment: Department | null;
    onDepartmentClick: (department: Department) => void;
    canCreateDepartment: boolean;
    onCreateDepartment: () => void;
    loading: boolean;
    filters: {
        search: string;
    };
}

export default function DepartmentList({
    departments,
    selectedDepartment,
    onDepartmentClick,
    canCreateDepartment,
    onCreateDepartment,
    loading,
    filters
}: DepartmentListProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading departments...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse p-2 border rounded">
                                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Department List</CardTitle>
                <CardDescription>
                    All departments in the system
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {!departments.data || departments.data.length === 0 ? (
                        <div className="text-center py-8">
                            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                No departments found.
                            </p>
                            {filters.search && (
                                <p className="text-xs text-muted-foreground">
                                    Try adjusting your search criteria.
                                </p>
                            )}
                            {canCreateDepartment && !filters.search && (
                                <div className="mt-4">
                                    <Button variant="outline" onClick={onCreateDepartment}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Department
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        departments.data.map((department: Department) => (
                            <div
                                key={department.id}
                                onClick={() => onDepartmentClick(department)}
                                className={`flex items-center justify-between p-3 border rounded ${selectedDepartment?.id === department.id ? 'border-primary' : ''} bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer select-none`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{department.name}</p>
                                        <span className={`text-xs ${department.status === 'active'
                                            ? 'text-green-800 dark:text-green-300'
                                            : 'text-gray-800 dark:text-gray-300'
                                            }`}>
                                            {department.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {department.users?.length || 0} users
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}