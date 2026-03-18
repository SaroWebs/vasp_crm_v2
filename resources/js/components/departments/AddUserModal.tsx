import { Button } from '@/components/ui/button';
import { Department } from '@/types';
import { UserPlus, X, Mail } from 'lucide-react';


interface AvailableUser {
    id: number;
    name: string;
    email: string;
}

interface AddUserModalProps {
    open: boolean;
    department: Department | null;
    availableUsers: AvailableUser[];
    selectedUsers: number[];
    onClose: () => void;
    onUserToggle: (userId: number) => void;
    onAssignUsers: () => void;
    loadingAvailableUsers: boolean;
    assigningUsers: boolean;
}

export default function AddUserModal({
    open,
    department,
    availableUsers,
    selectedUsers,
    onClose,
    onUserToggle,
    onAssignUsers,
    loadingAvailableUsers,
    assigningUsers
}: AddUserModalProps) {
    if (!open || !department) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                        Add Users to {department.name}
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                        Select users to assign to this department. Users already assigned are hidden.
                    </p>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {loadingAvailableUsers ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {availableUsers.filter(user =>
                                !department.users?.some(deptUser => deptUser.id === user.id)
                            ).length > 0 ? (
                                availableUsers
                                    .filter(user =>
                                        !department.users?.some(deptUser => deptUser.id === user.id)
                                    )
                                    .map((user) => (
                                        <label
                                            key={user.id}
                                            className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => onUserToggle(user.id)}
                                                className="rounded border-gray-300"
                                            />
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Mail className="mr-1 h-3 w-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </label>
                                    ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm">All available users are already assigned</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={assigningUsers}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onAssignUsers}
                        disabled={selectedUsers.length === 0 || assigningUsers}
                    >
                        {assigningUsers ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}