import { useState, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Flag,
    Plus,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    Trash2,
    Loader,
    Edit,
} from 'lucide-react';

interface Milestone {
    id: number;
    task_id: number;
    event_name: string;
    event_description: string | null;
    event_date: string;
    is_milestone: boolean;
    milestone_type?: string;
    target_date?: string;
    is_completed?: boolean;
    completed_at?: string | null;
    progress_percentage?: number;
    created_at: string;
    updated_at: string;
}

interface MilestoneFormData {
    event_name: string;
    event_description: string;
    milestone_type: string;
    target_date: Date | null;
    event_date: Date | null;
    progress_percentage: number;
}

interface TaskMilestonesProps {
    taskId: number;
    taskStartAt?: string;
    taskDueAt?: string;
    initialMilestones?: Milestone[];
    isOwnTask?: boolean;
    isSuperAdmin?: boolean;
    taskState?: string;
}

const milestoneTypes = [
    { value: 'start', label: 'Start', description: 'Task start milestone' },
    { value: 'checkpoint', label: 'Checkpoint', description: 'Progress checkpoint' },
    { value: 'completion', label: 'Completion', description: 'Final completion milestone' },
    { value: 'deadline', label: 'Deadline', description: 'Important deadline' },
];

export function TaskMilestones({ taskId, taskStartAt, taskDueAt, initialMilestones = [], isOwnTask = false, isSuperAdmin = false, taskState }: TaskMilestonesProps) {
    const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [deletingMilestoneId, setDeletingMilestoneId] = useState<number | null>(null);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [formData, setFormData] = useState<MilestoneFormData>({
        event_name: '',
        event_description: '',
        milestone_type: 'checkpoint',
        target_date: null as Date | null,
        event_date: null as Date | null,
        progress_percentage: 0,
    });
    const [editFormData, setEditFormData] = useState<MilestoneFormData>({
        event_name: '',
        event_description: '',
        milestone_type: 'checkpoint',
        target_date: null as Date | null,
        event_date: null as Date | null,
        progress_percentage: 0,
    });
    const [dateError, setDateError] = useState<string | null>(null);
    const [editDateError, setEditDateError] = useState<string | null>(null);
    const [eventDateInput, setEventDateInput] = useState('');
    const [targetDateInput, setTargetDateInput] = useState('');
    const [editEventDateInput, setEditEventDateInput] = useState('');
    const [editTargetDateInput, setEditTargetDateInput] = useState('');

    const toDateTimeLocalValue = (value?: string | Date | null) => {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const parseDateTimeLocal = (value: string): Date | null => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const roundUpToInterval = (date: Date, intervalMinutes = 5): Date => {
        const intervalMs = intervalMinutes * 60 * 1000;
        const roundedMs = Math.ceil(date.getTime() / intervalMs) * intervalMs;
        return new Date(roundedMs);
    };

    const addMinutes = (date: Date, minutes: number): Date =>
        new Date(date.getTime() + minutes * 60 * 1000);

    const createMilestoneFormData = (milestone?: Milestone): MilestoneFormData => {
        if (milestone) {
            return {
                event_name: milestone.event_name,
                event_description: milestone.event_description ?? '',
                milestone_type: milestone.milestone_type ?? 'checkpoint',
                target_date: milestone.target_date ? new Date(milestone.target_date) : null,
                event_date: milestone.event_date ? new Date(milestone.event_date) : null,
                progress_percentage: milestone.progress_percentage ?? 0,
            };
        }

        const defaultSlot = getDefaultTimeSlot();

        return {
            event_name: '',
            event_description: '',
            milestone_type: 'checkpoint',
            event_date: defaultSlot?.eventDate ?? null,
            target_date: defaultSlot?.targetDate ?? null,
            progress_percentage: 0,
        };
    };

    const getDefaultTimeSlot = (): { eventDate: Date; targetDate: Date } | null => {
        const now = new Date();
        const taskStart = taskStartAt ? new Date(taskStartAt) : null;
        const taskDue = taskDueAt ? new Date(taskDueAt) : null;

        const latestMilestoneTarget = milestones
            .map((milestone) => (milestone.target_date ? new Date(milestone.target_date) : null))
            .filter((value): value is Date => !!value && !Number.isNaN(value.getTime()))
            .sort((a, b) => b.getTime() - a.getTime())[0];

        let eventDate = roundUpToInterval(
            latestMilestoneTarget ??
                (taskStart && taskStart > now ? taskStart : now),
            5,
        );
        let targetDate = addMinutes(eventDate, 5);

        if (taskStart && eventDate < taskStart) {
            eventDate = roundUpToInterval(taskStart, 5);
            targetDate = addMinutes(eventDate, 5);
        }

        if (taskDue && targetDate > taskDue) {
            targetDate = new Date(taskDue);
            eventDate = addMinutes(targetDate, -5);
            if (taskStart && eventDate < taskStart) {
                eventDate = new Date(taskStart);
            }
        }

        if (targetDate <= eventDate) {
            return null;
        }

        return { eventDate, targetDate };
    };

    const resetMilestoneForm = () => {
        const defaultFormData = createMilestoneFormData();

        setFormData(defaultFormData);
        setEventDateInput(defaultFormData.event_date ? toDateTimeLocalValue(defaultFormData.event_date) : '');
        setTargetDateInput(defaultFormData.target_date ? toDateTimeLocalValue(defaultFormData.target_date) : '');
        setDateError(null);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            resetMilestoneForm();
        }
    };

    const handleEditDialogOpenChange = (open: boolean) => {
        setIsEditOpen(open);
        if (!open) {
            setEditingMilestone(null);
            setEditDateError(null);
            setIsEditSubmitting(false);
        }
    };

    const validateDateBounds = (eventDate: Date | null, targetDate: Date | null): string | null => {
        if (!eventDate || !targetDate) {
            return 'Please select both event date and target date';
        }

        if (taskStartAt) {
            const taskStart = new Date(taskStartAt);
            if (eventDate < taskStart) {
                return `Event date cannot be before task start date (${format(new Date(taskStartAt), 'MMM dd, yyyy p')})`;
            }
            if (targetDate < taskStart) {
                return `Target date cannot be before task start date (${format(new Date(taskStartAt), 'MMM dd, yyyy p')})`;
            }
        }

        if (taskDueAt) {
            const taskDue = new Date(taskDueAt);
            if (eventDate > taskDue) {
                return `Event date cannot be after task due date (${format(new Date(taskDueAt), 'MMM dd, yyyy p')})`;
            }
            if (targetDate > taskDue) {
                return `Target date cannot be after task due date (${format(new Date(taskDueAt), 'MMM dd, yyyy p')})`;
            }
        }

        if (eventDate >= targetDate) {
            return 'Target date must be after event date';
        }

        return null;
    };

    const validateMilestoneForm = (
        currentFormData: MilestoneFormData,
        currentMilestoneId?: number,
        actionLabel: 'create' | 'update' = 'create',
    ): string | null => {
        const eventDate = currentFormData.event_date;
        const targetDate = currentFormData.target_date;

        const dateValidationError = validateDateBounds(eventDate, targetDate);
        if (dateValidationError) {
            return dateValidationError;
        }

        if (!eventDate || !targetDate) {
            return 'Please select both event date and target date';
        }

        const existingMilestones = milestones.filter(
            (milestone) =>
                milestone.event_date &&
                milestone.target_date &&
                !milestone.is_completed &&
                milestone.id !== currentMilestoneId,
        );

        for (const milestone of existingMilestones) {
            const existingStart = new Date(milestone.event_date!);
            const existingEnd = new Date(milestone.target_date!);
            const isOverlapping =
                eventDate.getTime() < existingEnd.getTime() &&
                targetDate.getTime() > existingStart.getTime();

            if (isOverlapping) {
                return `Cannot ${actionLabel} milestone - timeslot overlaps "${milestone.event_name}" (${format(existingStart, 'MMM dd, yyyy p')} to ${format(existingEnd, 'MMM dd, yyyy p')})`;
            }
        }

        const lastCompletedMilestone = milestones
            .filter((milestone) => milestone.is_completed && milestone.milestone_type)
            .sort(
                (a, b) =>
                    new Date(b.completed_at || 0).getTime() -
                    new Date(a.completed_at || 0).getTime(),
            )[0];

        const typeOrder = ['start', 'checkpoint', 'completion', 'deadline'];
        if (lastCompletedMilestone?.milestone_type) {
            const lastTypeIndex = typeOrder.indexOf(lastCompletedMilestone.milestone_type);
            const newTypeIndex = typeOrder.indexOf(currentFormData.milestone_type);
            if (
                newTypeIndex <= lastTypeIndex &&
                currentFormData.milestone_type !== lastCompletedMilestone.milestone_type
            ) {
                return `After completing "${lastCompletedMilestone.event_name}" (${lastCompletedMilestone.milestone_type}), you cannot ${actionLabel} a ${currentFormData.milestone_type} milestone`;
            }
        }

        return null;
    };

    // Determine if user can add milestones (own task or super admin, and task not completed)
    const isTaskCompleted = taskState === 'Done' || taskState === 'Cancelled' || taskState === 'Rejected';
    const canManageMilestones = isOwnTask || isSuperAdmin;
    const canAddMilestone = canManageMilestones && !isTaskCompleted;

    const renderMilestoneFormFields = (
        currentFormData: MilestoneFormData,
        setCurrentFormData: Dispatch<SetStateAction<MilestoneFormData>>,
        currentEventDateInput: string,
        setCurrentEventDateInput: Dispatch<SetStateAction<string>>,
        currentTargetDateInput: string,
        setCurrentTargetDateInput: Dispatch<SetStateAction<string>>,
        currentDateError: string | null,
        setCurrentDateError: Dispatch<SetStateAction<string | null>>,
    ) => (
        <>
            {currentDateError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {currentDateError}
                </div>
            )}
            <div className="grid gap-2">
                <Label htmlFor="event_name">Milestone Name *</Label>
                <Input
                    id="event_name"
                    value={currentFormData.event_name}
                    onChange={(e) =>
                        setCurrentFormData({
                            ...currentFormData,
                            event_name: e.target.value,
                        })
                    }
                    placeholder="e.g., Design Review, Testing Phase"
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="milestone_type">Milestone Type *</Label>
                <Select
                    value={currentFormData.milestone_type}
                    onValueChange={(value) =>
                        setCurrentFormData({ ...currentFormData, milestone_type: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select milestone type" />
                    </SelectTrigger>
                    <SelectContent>
                        {milestoneTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label} - {type.description}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="event_date">Event Date *</Label>
                    <Input
                        id="event_date"
                        type="datetime-local"
                        value={currentEventDateInput}
                        onChange={(e) => {
                            const value = e.target.value;
                            const parsedDate = parseDateTimeLocal(value);
                            setCurrentEventDateInput(value);
                            setCurrentFormData((prev) => ({
                                ...prev,
                                event_date: parsedDate,
                            }));
                            setCurrentDateError(null);
                        }}
                        min={toDateTimeLocalValue(taskStartAt)}
                        max={toDateTimeLocalValue(taskDueAt)}
                        className="w-full"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="target_date">Target Date *</Label>
                    <Input
                        id="target_date"
                        type="datetime-local"
                        value={currentTargetDateInput}
                        onChange={(e) => {
                            const value = e.target.value;
                            const parsedDate = parseDateTimeLocal(value);
                            setCurrentTargetDateInput(value);
                            setCurrentFormData((prev) => ({
                                ...prev,
                                target_date: parsedDate,
                            }));
                            setCurrentDateError(null);
                        }}
                        min={currentEventDateInput || toDateTimeLocalValue(taskStartAt)}
                        max={toDateTimeLocalValue(taskDueAt)}
                        className="w-full"
                        required
                    />
                </div>
            </div>
            {currentFormData.event_date && currentFormData.target_date && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                    <p className="font-medium">Milestone Time Slot</p>
                    <p>
                        {format(currentFormData.event_date, 'MMM dd, yyyy p')} to{' '}
                        {format(currentFormData.target_date, 'MMM dd, yyyy p')} (
                        {Math.max(
                            1,
                            Math.round(
                                (currentFormData.target_date.getTime() -
                                    currentFormData.event_date.getTime()) /
                                    (60 * 1000),
                            ),
                        )}{' '}
                        min)
                    </p>
                </div>
            )}
            {(taskStartAt || taskDueAt) && (
                <p className="text-xs text-muted-foreground">
                    Allowed window:{' '}
                    {taskStartAt ? format(new Date(taskStartAt), 'MMM dd, yyyy p') : 'N/A'} to{' '}
                    {taskDueAt ? format(new Date(taskDueAt), 'MMM dd, yyyy p') : 'N/A'}
                </p>
            )}

            <div className="grid gap-2">
                <Label htmlFor="progress_percentage">Initial Progress (%)</Label>
                <Input
                    id="progress_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={currentFormData.progress_percentage}
                    onChange={(e) =>
                        setCurrentFormData({
                            ...currentFormData,
                            progress_percentage: parseInt(e.target.value) || 0,
                        })
                    }
                    placeholder="0"
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="event_description">Description</Label>
                <Textarea
                    id="event_description"
                    value={currentFormData.event_description}
                    onChange={(e) =>
                        setCurrentFormData({
                            ...currentFormData,
                            event_description: e.target.value,
                        })
                    }
                    placeholder="Optional description for this milestone"
                    rows={3}
                />
            </div>
        </>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setDateError(null);

        const validationError = validateMilestoneForm(formData, undefined, 'create');
        if (validationError) {
            setDateError(validationError);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await axios.post('/timeline-events/milestones', {
                task_id: taskId,
                event_name: formData.event_name,
                event_description: formData.event_description,
                milestone_type: formData.milestone_type,
                event_date: formData.event_date ? format(formData.event_date, 'yyyy-MM-dd HH:mm:ss') : null,
                target_date: formData.target_date ? format(formData.target_date, 'yyyy-MM-dd HH:mm:ss') : null,
                progress_percentage: formData.progress_percentage,
            });

            if (response.data) {
                setMilestones((previousMilestones) => [...previousMilestones, response.data]);
                setIsOpen(false);
            }
        } catch (error: unknown) {
            console.error('Error creating milestone:', error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            if (axiosError.response?.data?.error) {
                setDateError(axiosError.response.data.error);
            } else {
                alert('Failed to create milestone. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditMilestone = (milestone: Milestone) => {
        setEditingMilestone(milestone);
        const milestoneFormData = createMilestoneFormData(milestone);
        setEditFormData(milestoneFormData);
        setEditEventDateInput(milestoneFormData.event_date ? toDateTimeLocalValue(milestoneFormData.event_date) : '');
        setEditTargetDateInput(milestoneFormData.target_date ? toDateTimeLocalValue(milestoneFormData.target_date) : '');
        setEditDateError(null);
        setIsEditOpen(true);
    };

    const handleUpdateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingMilestone) {
            return;
        }

        setIsEditSubmitting(true);
        setEditDateError(null);

        const validationError = validateMilestoneForm(editFormData, editingMilestone.id, 'update');
        if (validationError) {
            setEditDateError(validationError);
            setIsEditSubmitting(false);
            return;
        }

        try {
            const response = await axios.patch(`/timeline-events/${editingMilestone.id}/milestone`, {
                event_name: editFormData.event_name,
                event_description: editFormData.event_description,
                milestone_type: editFormData.milestone_type,
                event_date: editFormData.event_date
                    ? format(editFormData.event_date, 'yyyy-MM-dd HH:mm:ss')
                    : null,
                target_date: editFormData.target_date
                    ? format(editFormData.target_date, 'yyyy-MM-dd HH:mm:ss')
                    : null,
                progress_percentage: editFormData.progress_percentage,
            });

            if (response.data) {
                setMilestones((previousMilestones) =>
                    previousMilestones.map((milestone) =>
                        milestone.id === editingMilestone.id ? response.data : milestone,
                    ),
                );
                setIsEditOpen(false);
                setEditingMilestone(null);
            }
        } catch (error: unknown) {
            console.error('Error updating milestone:', error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            if (axiosError.response?.data?.error) {
                setEditDateError(axiosError.response.data.error);
            } else {
                alert('Failed to update milestone. Please try again.');
            }
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const handleCompleteMilestone = async (milestoneId: number) => {
        try {
            const response = await axios.patch(`/timeline-events/${milestoneId}/complete`, {
                progress_percentage: 100,
            });

            setMilestones((previousMilestones) =>
                previousMilestones.map((milestone) =>
                    milestone.id === milestoneId
                        ? {
                              ...milestone,
                              is_completed: true,
                              completed_at: response.data.completed_at,
                              progress_percentage: 100,
                          }
                        : milestone,
                ),
            );
        } catch (error) {
            console.error('Error completing milestone:', error);
            alert('Failed to complete milestone. Please try again.');
        }
    };

    const handleDeleteMilestone = async (milestoneId: number) => {
        const confirmed = window.confirm('Are you sure you want to delete this milestone?');
        if (!confirmed) {
            return;
        }

        setDeletingMilestoneId(milestoneId);

        try {
            await axios.delete(`/timeline-events/${milestoneId}/milestone`);
            setMilestones((previousMilestones) =>
                previousMilestones.filter((milestone) => milestone.id !== milestoneId),
            );
        } catch (error) {
            console.error('Error deleting milestone:', error);
            alert('Failed to delete milestone. Please try again.');
        } finally {
            setDeletingMilestoneId(null);
        }
    };

    const getMilestoneTypeColor = (type?: string) => {
        switch (type) {
            case 'start':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'checkpoint':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completion':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'deadline':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const isOverdue = (milestone: Milestone) => {
        if (milestone.is_completed || !milestone.target_date) return false;
        return new Date(milestone.target_date) < new Date();
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5" />
                        Milestones
                    </CardTitle>
                    <CardDescription>
                        Track progress with task milestones
                    </CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
                    {canAddMilestone && (
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <Plus className="h-4 w-4" />
                                Add Milestone
                            </Button>
                        </DialogTrigger>
                    )}
                    <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[85vh]">
                        <DialogHeader>
                            <DialogTitle>Add New Milestone</DialogTitle>
                            <DialogDescription>
                                Create a milestone to track progress on this task.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                {renderMilestoneFormFields(
                                    formData,
                                    setFormData,
                                    eventDateInput,
                                    setEventDateInput,
                                    targetDateInput,
                                    setTargetDateInput,
                                    dateError,
                                    setDateError,
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Milestone'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <Dialog open={isEditOpen} onOpenChange={handleEditDialogOpenChange}>
                    <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[85vh]">
                        <DialogHeader>
                            <DialogTitle>Edit Milestone</DialogTitle>
                            <DialogDescription>
                                Update the milestone details for this task.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateMilestone}>
                            <div className="grid gap-4 py-4">
                                {renderMilestoneFormFields(
                                    editFormData,
                                    setEditFormData,
                                    editEventDateInput,
                                    setEditEventDateInput,
                                    editTargetDateInput,
                                    setEditTargetDateInput,
                                    editDateError,
                                    setEditDateError,
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleEditDialogOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isEditSubmitting}>
                                    {isEditSubmitting ? 'Updating...' : 'Update Milestone'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {milestones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Flag className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                            {isTaskCompleted 
                                ? "This task is completed. Milestones cannot be added."
                                : canAddMilestone 
                                    ? "No milestones yet. Add a milestone to track progress."
                                    : "No milestones yet. Only task owners and super admins can add milestones."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {milestones
                            .filter(m => m.target_date)
                            .sort(
                                (a, b) =>
                                    new Date(a.target_date!).getTime() -
                                    new Date(b.target_date!).getTime()
                            )
                            .map((milestone) => (
                                <div
                                    key={milestone.id}
                                    className={`flex items-start justify-between rounded-lg border p-4 ${
                                        milestone.is_completed
                                            ? 'border-green-200 bg-green-50'
                                            : isOverdue(milestone)
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-1 ${
                                                milestone.is_completed
                                                    ? 'text-green-600'
                                                    : isOverdue(milestone)
                                                    ? 'text-red-600'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {milestone.is_completed ? (
                                                <CheckCircle className="h-5 w-5" />
                                            ) : isOverdue(milestone) ? (
                                                <AlertCircle className="h-5 w-5" />
                                            ) : (
                                                <Clock className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{milestone.event_name}</span>
                                                <Badge
                                                    className={getMilestoneTypeColor(milestone.milestone_type)}
                                                >
                                                    {milestone.milestone_type || 'milestone'}
                                                </Badge>
                                            </div>
                                            {milestone.event_description && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {milestone.event_description}
                                                </p>
                                            )}
                                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Event: {milestone.event_date ? format(new Date(milestone.event_date), 'MMM dd, yyyy p') : 'Not set'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Target: {milestone.target_date ? format(new Date(milestone.target_date), 'MMM dd, yyyy p') : 'Not set'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    Progress: {milestone.progress_percentage || 0}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!milestone.is_completed && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCompleteMilestone(milestone.id)}
                                            >
                                                <CheckCircle className="mr-1 h-4 w-4" />
                                                Complete
                                            </Button>
                                        )}
                                        {milestone.is_completed && milestone.completed_at && (
                                            <span className="text-xs text-green-600">
                                                Completed {format(new Date(milestone.completed_at || ''), 'MMM dd')}
                                            </span>
                                        )}
                                        {(!milestone.is_completed && canManageMilestones) && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditMilestone(milestone)}
                                                >
                                                    <Edit className="mr-1 h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => void handleDeleteMilestone(milestone.id)}
                                                    disabled={deletingMilestoneId === milestone.id}
                                                >
                                                    {deletingMilestoneId === milestone.id ? (
                                                        <Loader className="mr-1 h-4 w-4" />
                                                    ) : (
                                                        <Trash2 className="mr-1 h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
