import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Clock, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface TaskAssignmentModalProps {
    taskId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onAssignmentsUpdated?: () => void;
}

interface User {
    id: number;
    name: string;
    email: string;
}

type AssignmentState = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';

interface Assignment {
    id: number;
    user_id: number;
    user: User;
    assigned_at: string;
    assigned_by: number;
    assignment_notes: string;
    is_active: boolean;
    state: AssignmentState;
    accepted_at: string | null;
    completed_at: string | null;
    estimated_time: number | null;
}

export default function TaskAssignmentModal({
    taskId,
    isOpen,
    onClose,
    onAssignmentsUpdated
}: TaskAssignmentModalProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [removingAssignmentId, setRemovingAssignmentId] = useState<number | null>(null);
    const [assigning, setAssigning] = useState(false);

    // Fetch task assignments
    const fetchAssignments = async () => {
        if (!taskId) return;

        try {
            setLoading(true);
            const response = await axios.get(`/api/tasks/${taskId}/assignments`);
            setAssignments(response.data.data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load task assignments');
        } finally {
            setLoading(false);
        }
    };

    // Fetch available users
    const fetchAvailableUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await axios.get('/admin/data/users/assignment');
            console.log('Users API response:', response.data); // Debug log
            // Filter out users already assigned to this task
            const alreadyAssignedIds = assignments.map(a => a.user_id);
            const usersData = response.data.data || response.data.users || [];
            const filteredUsers = usersData
                .filter((user: User) => !alreadyAssignedIds.includes(user.id));
            setAvailableUsers(filteredUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load available users');
        } finally {
            setLoadingUsers(false);
        }
    };

    // Handle assigning a user
    const handleAssignUser = async () => {
        if (!selectedUserId || !taskId) {
            toast.error('Please select a user to assign');
            return;
        }

        try {
            setAssigning(true);
            const response = await axios.post(`/api/tasks/${taskId}/assign`, {
                user_id: selectedUserId,
                assignment_notes: assignmentNotes || 'Assigned via task manager',
                estimated_time: estimatedTime ? parseFloat(estimatedTime) : null
            });

            toast.success('User assigned successfully');
            fetchAssignments();
            if (onAssignmentsUpdated) {
                onAssignmentsUpdated();
            }
            
            // Reset form
            setSelectedUserId(null);
            setAssignmentNotes('');
            setEstimatedTime('');
        } catch (error) {
            console.error('Error assigning user:', error);
            const errorMessage = 'Failed to assign user';
            toast.error(errorMessage);
        } finally {
            setAssigning(false);
        }
    };


    // Handle removing an assignment
    const handleRemoveAssignment = async (assignmentId: number, userId: number) => {
        if (!taskId) return;

        try {
            setRemovingAssignmentId(assignmentId);
            await axios.post(`/api/tasks/${taskId}/unassign`, {
                user_id: userId
            });

            toast.success('User unassigned successfully');
            fetchAssignments();
            if (onAssignmentsUpdated) {
                onAssignmentsUpdated();
            }
        } catch (error) {
            console.error('Error removing assignment:', error);
            toast.error('Failed to remove assignment');
        } finally {
            setRemovingAssignmentId(null);
        }
    };

    // Get state badge variant
    const getStateBadge = (state: AssignmentState): "default" | "secondary" | "destructive" | "outline" => {
        const variants: Record<AssignmentState, "default" | "secondary" | "destructive" | "outline"> = {
            'pending': 'secondary',
            'accepted': 'default',
            'in_progress': 'outline',
            'completed': 'default',
            'rejected': 'destructive'
        };
        return variants[state];
    };

    // Get state icon
    const getStateIcon = (state: AssignmentState): React.ReactElement => {
        const icons: Record<AssignmentState, React.ReactElement> = {
            'pending': <Clock className="h-3 w-3" />,
            'accepted': <UserPlus className="h-3 w-3" />,
            'in_progress': <Loader2 className="h-3 w-3 animate-spin" />,
            'completed': <UserPlus className="h-3 w-3" />,
            'rejected': <X className="h-3 w-3" />
        };
        return icons[state];
    };

    useEffect(() => {
        if (isOpen && taskId) {
            fetchAssignments();
            fetchAvailableUsers();
        }
    }, [isOpen, taskId]);

    useEffect(() => {
        if (isOpen && taskId) {
            fetchAvailableUsers();
        }
    }, [assignments, isOpen, taskId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Task Assignments
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    {/* Current Assignments List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Current Assignments</h3>
                        
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : assignments.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No users assigned to this task yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {assignments.map((assignment) => (
                                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-medium text-sm">
                                                    {assignment.user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{assignment.user.name}</p>
                                                <p className="text-sm text-muted-foreground">{assignment.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getStateBadge(assignment.state)} className="gap-1">
                                                {getStateIcon(assignment.state)}
                                                <span className="capitalize">{assignment.state.replace('_', ' ')}</span>
                                            </Badge>
                                            {assignment.estimated_time && (
                                                <Badge variant="outline" className="gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{assignment.estimated_time}h</span>
                                                </Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-800"
                                                onClick={() => handleRemoveAssignment(assignment.id, assignment.user_id)}
                                                disabled={!!removingAssignmentId}
                                            >
                                                {removingAssignmentId === assignment.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <UserMinus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assignment Form */}
                    <div className="border-t pt-4 lg:border-t-0 lg:pt-0">
                        <h3 className="text-lg font-medium mb-4">Assign New User</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select User</label>
                                <select
                                    value={selectedUserId || ''}
                                    onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loadingUsers || assigning}
                                >
                                    <option value="">Select a user...</option>
                                    {loadingUsers ? (
                                        <option value="" disabled>Loading users...</option>
                                    ) : availableUsers.length === 0 ? (
                                        <option value="" disabled>No available users</option>
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
                                <label className="block text-sm font-medium mb-1">Assignment Notes</label>
                                <textarea
                                    value={assignmentNotes}
                                    onChange={(e) => setAssignmentNotes(e.target.value)}
                                    placeholder="Optional notes about this assignment"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                    disabled={assigning}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Estimated Time (hours)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    placeholder="Optional estimated time"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={assigning}
                                />
                            </div>

                            <Button
                                onClick={handleAssignUser}
                                disabled={!selectedUserId || assigning}
                                className="gap-2"
                            >
                                {assigning ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        Assign User
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}