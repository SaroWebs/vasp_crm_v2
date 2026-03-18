import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, UserPlus, X, Mail, Shield, Trash2 } from 'lucide-react';
import { Department } from '@/types';


interface DepartmentDetailsProps {
    department: Department;
    canManageEmployees: boolean;
    canDeleteDepartment: boolean;
    onEditDepartment: (department: Department) => void;
    onDeleteDepartment: (department: Department) => void;
    onAddUser: () => void;
    onRemoveUser: (userId: number) => void;
    removingUserId: number | null;
}

export default function DepartmentDetails({
    department,
    canManageEmployees,
    canDeleteDepartment,
    onEditDepartment,
    onDeleteDepartment,
    onAddUser,
    onRemoveUser,
    removingUserId
}: DepartmentDetailsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className='capitalize'>
                        {department.name}
                    </span>
                    {canManageEmployees && (
                        <Button variant="ghost" size="sm" onClick={() => onEditDepartment(department)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                   
                </CardTitle>
                <CardDescription>
                    {department.description || 'No description'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {department.users?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {department.users?.filter(u => u.roles && u.roles.length > 0).length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">With Roles</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {department.users?.filter(u => !u.roles || u.roles.length === 0).length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">No Roles</div>
                        </div>
                    </div>

                    {canManageEmployees && (
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Department Members</h3>
                            <Button
                                onClick={onAddUser}
                                size="sm"
                                variant="outline"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {department.users && department.users.length > 0 ? (
                            department.users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-800">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {user.name}
                                            </p>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Mail className="mr-1 h-3 w-3" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1">
                                            {user.roles && user.roles.length > 0 ? (
                                                user.roles.map((role) => (
                                                    <span
                                                        key={role.id}
                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                    >
                                                        <Shield className="mr-1 h-3 w-3" />
                                                        {role.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    No roles
                                                </span>
                                            )}
                                        </div>

                                        {canManageEmployees && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRemoveUser(user.id)}
                                                disabled={removingUserId === user.id}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                {removingUserId === user.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm">No users assigned to this department</p>
                                {canManageEmployees && (
                                    <Button
                                        onClick={onAddUser}
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add First User
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="">
                        <div className="flex items-center">
                            <h3 className="text-lg font-medium">Department Settings</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage department configuration, update details, or remove the department entirely.
                        </p>
                        <div className="flex gap-2 mt-2">
                            {canDeleteDepartment && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDeleteDepartment(department)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Department
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}