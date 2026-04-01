import { useState } from 'react';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingMilestoneId, setDeletingMilestoneId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        event_name: '',
        event_description: '',
        milestone_type: 'checkpoint',
        target_date: null as Date | null,
        event_date: null as Date | null,
        progress_percentage: 0,
    });
    const [dateError, setDateError] = useState<string | null>(null);
    const [eventDateInput, setEventDateInput] = useState('');
    const [targetDateInput, setTargetDateInput] = useState('');

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
        const defaultSlot = getDefaultTimeSlot();

        setFormData({
            event_name: '',
            event_description: '',
            milestone_type: 'checkpoint',
            event_date: defaultSlot?.eventDate ?? null,
            target_date: defaultSlot?.targetDate ?? null,
            progress_percentage: 0,
        });
        setEventDateInput(defaultSlot ? toDateTimeLocalValue(defaultSlot.eventDate) : '');
        setTargetDateInput(defaultSlot ? toDateTimeLocalValue(defaultSlot.targetDate) : '');
        setDateError(null);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            resetMilestoneForm();
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

    // Determine if user can add milestones (own task or super admin, and task not completed)
    const isTaskCompleted = taskState === 'Done' || taskState === 'Cancelled' || taskState === 'Rejected';
    const canManageMilestones = isOwnTask || isSuperAdmin;
    const canAddMilestone = canManageMilestones && !isTaskCompleted;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setDateError(null);

        // Validate dates
        const eventDate = formData.event_date;
        const targetDate = formData.target_date;

        const dateValidationError = validateDateBounds(eventDate, targetDate);
        if (dateValidationError) {
            setDateError(dateValidationError);
            setIsSubmitting(false);
            return;
        }
        if (!eventDate || !targetDate) {
            setDateError('Please select both event date and target date');
            setIsSubmitting(false);
            return;
        }

        // Validate no overlap with existing milestone time slots.
        const existingMilestones = milestones.filter((m) => m.event_date && m.target_date && !m.is_completed);
        for (const milestone of existingMilestones) {
            const existingStart = new Date(milestone.event_date!);
            const existingEnd = new Date(milestone.target_date!);
            const isOverlapping =
                eventDate.getTime() < existingEnd.getTime() &&
                targetDate.getTime() > existingStart.getTime();

            if (isOverlapping) {
                setDateError(
                    `Cannot create milestone - timeslot overlaps "${milestone.event_name}" (${format(existingStart, 'MMM dd, yyyy p')} to ${format(existingEnd, 'MMM dd, yyyy p')})`,
                );
                setIsSubmitting(false);
                return;
            }
        }

        // Check milestone type order constraints
        const lastCompletedMilestone = milestones
            .filter(m => m.is_completed && m.milestone_type)
            .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())[0];
        
        const typeOrder = ['start', 'checkpoint', 'completion', 'deadline'];
        if (lastCompletedMilestone?.milestone_type) {
            const lastTypeIndex = typeOrder.indexOf(lastCompletedMilestone.milestone_type);
            const newTypeIndex = typeOrder.indexOf(formData.milestone_type);
            if (newTypeIndex <= lastTypeIndex && formData.milestone_type !== lastCompletedMilestone.milestone_type) {
                setDateError(`After completing "${lastCompletedMilestone.event_name}" (${lastCompletedMilestone.milestone_type}), you cannot create a ${formData.milestone_type} milestone`);
                setIsSubmitting(false);
                return;
            }
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
                setMilestones([...milestones, response.data]);
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

    const handleCompleteMilestone = async (milestoneId: number) => {
        try {
            const response = await axios.patch(`/timeline-events/${milestoneId}/complete`, {
                progress_percentage: 100,
            });

            setMilestones(
                milestones.map((m) =>
                    m.id === milestoneId
                        ? {
                              ...m,
                              is_completed: true,
                              completed_at: response.data.completed_at,
                              progress_percentage: 100,
                          }
                        : m
                )
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
                    <DialogTrigger asChild>
                        {canAddMilestone && (
                            <Button size="sm" className="gap-1">
                                <Plus className="h-4 w-4" />
                                Add Milestone
                            </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[85vh]">
                        <DialogHeader>
                            <DialogTitle>Add New Milestone</DialogTitle>
                            <DialogDescription>
                                Create a milestone to track progress on this task.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                {dateError && (
                                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                                        {dateError}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="event_name">Milestone Name *</Label>
                                    <Input
                                        id="event_name"
                                        value={formData.event_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
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
                                        value={formData.milestone_type}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, milestone_type: value })
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
                                            value={eventDateInput}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const parsedDate = parseDateTimeLocal(value);
                                                setEventDateInput(value);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    event_date: parsedDate,
                                                }));
                                                setDateError(null);
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
                                            value={targetDateInput}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const parsedDate = parseDateTimeLocal(value);
                                                setTargetDateInput(value);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    target_date: parsedDate,
                                                }));
                                                setDateError(null);
                                            }}
                                            min={eventDateInput || toDateTimeLocalValue(taskStartAt)}
                                            max={toDateTimeLocalValue(taskDueAt)}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                </div>
                                {formData.event_date && formData.target_date && (
                                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                                        <p className="font-medium">Milestone Time Slot</p>
                                        <p>
                                            {format(formData.event_date, 'MMM dd, yyyy p')} to{' '}
                                            {format(formData.target_date, 'MMM dd, yyyy p')} (
                                            {Math.max(
                                                1,
                                                Math.round(
                                                    (formData.target_date.getTime() - formData.event_date.getTime()) /
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
                                        value={formData.progress_percentage}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
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
                                        value={formData.event_description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                event_description: e.target.value,
                                            })
                                        }
                                        placeholder="Optional description for this milestone"
                                        rows={3}
                                    />
                                </div>
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
                                        {canManageMilestones && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => void handleDeleteMilestone(milestone.id)}
                                                disabled={deletingMilestoneId === milestone.id}
                                            >
                                                <Trash2 className="mr-1 h-4 w-4" />
                                                {deletingMilestoneId === milestone.id ? 'Deleting...' : 'Delete'}
                                            </Button>
                                        )}
                                        {milestone.is_completed && milestone.completed_at && (
                                            <span className="text-xs text-green-600">
                                                Completed {format(new Date(milestone.completed_at || ''), 'MMM dd')}
                                            </span>
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
