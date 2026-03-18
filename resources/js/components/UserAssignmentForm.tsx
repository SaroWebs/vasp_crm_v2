import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface UserAssignmentFormProps {
    taskId?: number;
    initialAssignments?: Array<{
        user_id: number;
        assignment_notes?: string;
        estimated_time?: number;
    }>;
    onAssignmentsChange?: (assignments: Array<{
        user_id: number;
        assignment_notes?: string;
        estimated_time?: number;
    }>) => void;
}

interface User {
    id: number;
    name: string;
    email: string;
}

export default function UserAssignmentForm({
    taskId,
    initialAssignments = [],
    onAssignmentsChange,
}: UserAssignmentFormProps) {
    const [assignments, setAssignments] = useState(initialAssignments);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Fetch available employees
    const fetchAvailableUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await axios.get('/admin/data/users/assignment');

            // Filter out users already assigned
            const alreadyAssignedIds = assignments.map((a) => a.user_id);
            const filteredUsers = response.data.users.filter(
                (user: User) => !alreadyAssignedIds.includes(user.id)
            );
            setAvailableUsers(filteredUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load available users');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchAvailableUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (onAssignmentsChange) {
            onAssignmentsChange(assignments);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignments]);

    const handleAddAssignment = () => {
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        const newAssignment = {
            user_id: selectedUserId,
            assignment_notes: assignmentNotes || undefined,
            estimated_time: estimatedTime ? parseFloat(estimatedTime) : undefined,
        };

        setAssignments([...assignments, newAssignment]);

        // Reset form
        setSelectedUserId(null);
        setAssignmentNotes('');
        setEstimatedTime('');

        // Refresh available users
        fetchAvailableUsers();
    };

    const handleRemoveAssignment = (userId: number) => {
        setAssignments(assignments.filter((a) => a.user_id !== userId));
        // Refresh available users
        fetchAvailableUsers();
    };

    const getUserName = (userId: number) => {
        // Try to find in availableUsers or initialAssignments
        const allUsers = [...availableUsers];
        const user = allUsers.find((u: any) => u.id === userId);
        return user ? user.name : `User #${userId}`;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">User Assignments</h3>
            <p className="text-sm text-muted-foreground">
                Assign users to this task. Users will be able to track and work on this task.
            </p>

            {/* Current Assignments */}
            {assignments.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Assigned Users:</p>
                    <div className="flex flex-wrap gap-2">
                        {assignments.map((assignment, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
                            >
                                <span className="font-medium">
                                    {getUserName(assignment.user_id)}
                                </span>
                                {assignment.estimated_time && (
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                        {assignment.estimated_time}h
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAssignment(assignment.user_id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assignment Form */}
            <div className="border-t pt-4 space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Select User</label>
                    <select
                        className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        value={selectedUserId ?? ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedUserId(value ? parseInt(value) : null);
                        }}
                        disabled={loadingUsers}
                    >
                        <option value="" disabled>
                            {loadingUsers
                                ? 'Loading users...'
                                : availableUsers.length === 0
                                ? 'No available users'
                                : 'Select a user to assign'}
                        </option>
                        {loadingUsers ? (
                            <option value="" disabled>
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading users...
                                </span>
                            </option>
                        ) : (
                            availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Assignment Notes (optional)
                    </label>
                    <Textarea
                        value={assignmentNotes}
                        onChange={(e) => setAssignmentNotes(e.target.value)}
                        placeholder="Notes about this assignment"
                        rows={2}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Estimated Time (hours, optional)
                    </label>
                    <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                        placeholder="Estimated time for this user"
                    />
                </div>

                <Button
                    type="button"
                    onClick={handleAddAssignment}
                    disabled={!selectedUserId || loadingUsers}
                    className="gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Assignment
                </Button>
            </div>
        </div>
    );
}