import axios from 'axios';
import { useMemo, useState } from 'react';
import { GitBranch, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TaskDurationPicker from '@/components/tasks/TaskDurationPicker';
import { ProjectPhase, ProjectTask, UserOption } from './types';
import { formatDate, formatDateTime } from './utils';

interface ProjectTasksTabProps {
    projectId: number;
    tasks: ProjectTask[];
    phases: ProjectPhase[];
    canCreateTask: boolean;
    onRefreshTasks: () => Promise<void>;
    onSuccess: (message: string) => void;
    onError: (error: unknown, fallback: string) => void;
}

const taskGroupConfig = {
    pending: ['Draft', 'Assigned'],
    active: ['InProgress', 'Blocked', 'InReview'],
    completed: ['Done', 'Cancelled', 'Rejected'],
};

export default function ProjectTasksTab({
    projectId,
    tasks,
    phases,
    canCreateTask,
    onRefreshTasks,
    onSuccess,
    onError,
}: ProjectTasksTabProps) {
    const [taskView, setTaskView] = useState<'list' | 'board' | 'gantt'>('list');
    const [quickTaskForm, setQuickTaskForm] = useState({
        title: '',
        description: '',
        phase_id: '',
        start_at: '',
        due_at: '',
        estimate_hours: '',
    });
    const [draggingTask, setDraggingTask] = useState<{
        taskId: number;
        mode: 'move' | 'resize-start' | 'resize-end';
        initialX: number;
        initialStart: number;
        initialEnd: number;
    } | null>(null);
    const [tempTaskDates, setTempTaskDates] = useState<{
        [taskId: number]: { start: string; end: string };
    }>({});
    const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const phaseById = useMemo(() => {
        const map = new Map<number, ProjectPhase>();
        phases.forEach((phase) => map.set(phase.id, phase));
        return map;
    }, [phases]);

    const pendingTasks = tasks.filter((task) => taskGroupConfig.pending.includes(task.state));
    const activeTasks = tasks.filter((task) => taskGroupConfig.active.includes(task.state));
    const completedTasks = tasks.filter((task) => taskGroupConfig.completed.includes(task.state));

    const ganttTasks = useMemo(() => tasks.filter((task) => task.start_at && task.due_at), [tasks]);
    const hasForwarding = (task: ProjectTask): boolean => {
        if (typeof task.has_forwardings === 'boolean') {
            return task.has_forwardings;
        }

        if (typeof task.forwardings_count === 'number') {
            return task.forwardings_count > 0;
        }

        if (Array.isArray(task.forwarding_waterfall) && task.forwarding_waterfall.length > 0) {
            return true;
        }

        if (Array.isArray(task.forwardings) && task.forwardings.length > 0) {
            return true;
        }

        return false;
    };

    const ganttBounds = useMemo(() => {
        if (!ganttTasks.length) {
            return null;
        }
        const starts = ganttTasks.map((task) => new Date(task.start_at as string).getTime());
        const ends = ganttTasks.map((task) => new Date(task.due_at as string).getTime());
        return { min: Math.min(...starts), max: Math.max(...ends) };
    }, [ganttTasks]);

    const handleQuickCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/admin/tasks', {
                title: quickTaskForm.title,
                description: quickTaskForm.description || null,
                project_id: projectId,
                phase_id: quickTaskForm.phase_id ? Number(quickTaskForm.phase_id) : null,
                start_at: quickTaskForm.start_at || null,
                due_at: quickTaskForm.due_at || null,
                estimate_hours: quickTaskForm.estimate_hours ? Number(quickTaskForm.estimate_hours) : null,
            });
            setQuickTaskForm({
                title: '',
                description: '',
                phase_id: '',
                start_at: '',
                due_at: '',
                estimate_hours: '',
            });
            await onRefreshTasks();
            onSuccess('Task created in project.');
        } catch (error) {
            onError(error, 'Failed to create task in project.');
        }
    };

    const handleTaskMouseDown = (
        e: React.MouseEvent,
        task: ProjectTask,
        mode: 'move' | 'resize-start' | 'resize-end'
    ) => {
        e.preventDefault();
        const start = new Date(task.start_at as string).getTime();
        const end = new Date(task.due_at as string).getTime();
        setDraggingTask({
            taskId: task.id,
            mode,
            initialX: e.clientX,
            initialStart: start,
            initialEnd: end,
        });
    };

    const handleTaskMouseMove = (e: React.MouseEvent, containerWidth: number) => {
        if (!draggingTask || !ganttBounds) return;

        const { taskId, mode, initialX, initialStart, initialEnd } = draggingTask;
        const totalSpan = ganttBounds.max - ganttBounds.min;
        const pixelsPerMs = containerWidth / totalSpan;
        const deltaX = e.clientX - initialX;
        const deltaMs = deltaX / pixelsPerMs;

        let newStart = initialStart;
        let newEnd = initialEnd;

        if (mode === 'move') {
            const duration = initialEnd - initialStart;
            newStart = initialStart + deltaMs;
            newEnd = newStart + duration;
        } else if (mode === 'resize-start') {
            newStart = Math.min(initialStart + deltaMs, initialEnd - 3600000); // At least 1 hour
        } else if (mode === 'resize-end') {
            newEnd = Math.max(initialEnd + deltaMs, initialStart + 3600000); // At least 1 hour
        }

        const formatDateTimeLocal = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setTempTaskDates((prev) => ({
            ...prev,
            [taskId]: {
                start: formatDateTimeLocal(new Date(newStart)),
                end: formatDateTimeLocal(new Date(newEnd)),
            },
        }));
    };

    const handleTaskMouseUp = async () => {
        if (!draggingTask || !tempTaskDates[draggingTask.taskId]) {
            setDraggingTask(null);
            return;
        }

        const { taskId } = draggingTask;
        const newDates = tempTaskDates[taskId];

        try {
            await axios.patch(`/admin/tasks/${taskId}/dates`, {
                start_at: newDates.start,
                due_at: newDates.end,
            });
            await onRefreshTasks();
            onSuccess('Task dates updated.');
        } catch (error) {
            onError(error, 'Failed to update task dates.');
        } finally {
            setDraggingTask(null);
            setTempTaskDates((prev) => {
                const next = { ...prev };
                delete next[taskId];
                return next;
            });
        }
    };

    const handleOpenAssignUser = async (taskId: number) => {
        setAssigningTaskId(taskId);
        setSelectedUserId('');
        try {
            const response = await axios.get(`/admin/tasks/${taskId}/available-users`);
            setAvailableUsers(response.data?.data || response.data || []);
        } catch (error) {
            onError(error, 'Failed to load available users.');
            setAssigningTaskId(null);
        }
    };

    const handleAssignUser = async () => {
        if (!assigningTaskId || !selectedUserId) return;

        try {
            await axios.post(`/admin/tasks/${assigningTaskId}/assign`, {
                user_id: Number(selectedUserId),
            });
            await onRefreshTasks();
            onSuccess('User assigned to task.');
            setAssigningTaskId(null);
            setAvailableUsers([]);
            setSelectedUserId('');
        } catch (error) {
            onError(error, 'Failed to assign user to task.');
        }
    };

    return (
        <div className="space-y-4">
            {canCreateTask && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Task In Project</CardTitle>
                        <CardDescription>Create a draft task directly under this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleQuickCreateTask} className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Title</Label>
                                <Input
                                    required
                                    value={quickTaskForm.title}
                                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
                                    placeholder="Task title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phase</Label>
                                <select
                                    className="h-10 w-full rounded border bg-background px-3"
                                    value={quickTaskForm.phase_id}
                                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, phase_id: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {phases.map((phase) => (
                                        <option key={phase.id} value={phase.id}>
                                            {phase.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <Label>Description</Label>
                                <Textarea
                                    value={quickTaskForm.description}
                                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, description: e.target.value })}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Start</Label>
                                <Input
                                    type="datetime-local"
                                    value={quickTaskForm.start_at}
                                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, start_at: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Due</Label>
                                <Input
                                    type="datetime-local"
                                    value={quickTaskForm.due_at}
                                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, due_at: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <TaskDurationPicker
                                    id="project-task-estimate-hours"
                                    label="Estimated Duration"
                                    value={quickTaskForm.estimate_hours}
                                    onChange={(value) => setQuickTaskForm({ ...quickTaskForm, estimate_hours: value })}
                                    helperText="Choose a duration using days, hours, and minutes."
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 md:col-span-3">
                                <Button type="submit">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Task
                                </Button>
                                <Button type="button" variant="outline" onClick={() => (window.location.href = `/admin/tasks/create?project_id=${projectId}`)}>
                                    Open Full Task Form
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Project Tasks</CardTitle>
                        <CardDescription>Task list, board, and timeline views for this project.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={taskView === 'list' ? 'default' : 'outline'} onClick={() => setTaskView('list')}>
                            List
                        </Button>
                        <Button variant={taskView === 'board' ? 'default' : 'outline'} onClick={() => setTaskView('board')}>
                            Board
                        </Button>
                        <Button variant={taskView === 'gantt' ? 'default' : 'outline'} onClick={() => setTaskView('gantt')}>
                            Gantt
                        </Button>
                        <Button variant="outline" onClick={() => void onRefreshTasks()}>
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {taskView === 'list' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-2 py-2">Task</th>
                                        <th className="px-2 py-2">State</th>
                                        <th className="px-2 py-2">Phase</th>
                                        <th className="px-2 py-2">Start</th>
                                        <th className="px-2 py-2">Due</th>
                                        <th className="px-2 py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr key={task.id} className="border-b">
                                            <td className="px-2 py-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{task.title || `Task #${task.id}`}</p>
                                                    {hasForwarding(task) && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700"
                                                            title="Forwarded task"
                                                        >
                                                            <GitBranch className="h-3 w-3" />
                                                            Forwarded
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{task.task_code}</p>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Badge variant="outline">{task.state}</Badge>
                                            </td>
                                            <td className="px-2 py-2">{task.project_phase?.name ?? (task.phase_id ? phaseById.get(task.phase_id)?.name : 'Unassigned')}</td>
                                            <td className="px-2 py-2">{formatDateTime(task.start_at)}</td>
                                            <td className="px-2 py-2">{formatDateTime(task.due_at)}</td>
                                            <td className="px-2 py-2">
                                                <Button size="sm" variant="outline" onClick={() => handleOpenAssignUser(task.id)}>
                                                    <UserPlus className="mr-1 h-3 w-3" />
                                                    Assign
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {tasks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No tasks linked to this project.</p>}

                            {/* User Assignment Modal */}
                            {assigningTaskId && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                    <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
                                        <h3 className="mb-4 text-lg font-semibold">Assign User to Task</h3>
                                        <div className="mb-4 space-y-2">
                                            <Label>Select User</Label>
                                            <select
                                                className="h-10 w-full rounded border bg-background px-3"
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                            >
                                                <option value="">Choose a user...</option>
                                                {availableUsers.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name} {user.email ? `(${user.email})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleAssignUser} disabled={!selectedUserId}>
                                                Assign User
                                            </Button>
                                            <Button variant="outline" onClick={() => setAssigningTaskId(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {taskView === 'board' && (
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded border p-3">
                                <h3 className="mb-3 font-semibold">Pending</h3>
                                <div className="space-y-2">
                                    {pendingTasks.map((task) => (
                                        <div key={task.id} className="rounded border bg-muted/40 p-2">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{task.title || `Task #${task.id}`}</p>
                                                {hasForwarding(task) && <GitBranch className="h-3 w-3 text-sky-700" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{task.state}</p>
                                        </div>
                                    ))}
                                    {pendingTasks.length === 0 && <p className="text-xs text-muted-foreground">No pending tasks.</p>}
                                </div>
                            </div>
                            <div className="rounded border p-3">
                                <h3 className="mb-3 font-semibold">Active</h3>
                                <div className="space-y-2">
                                    {activeTasks.map((task) => (
                                        <div key={task.id} className="rounded border bg-muted/40 p-2">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{task.title || `Task #${task.id}`}</p>
                                                {hasForwarding(task) && <GitBranch className="h-3 w-3 text-sky-700" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{task.state}</p>
                                        </div>
                                    ))}
                                    {activeTasks.length === 0 && <p className="text-xs text-muted-foreground">No active tasks.</p>}
                                </div>
                            </div>
                            <div className="rounded border p-3">
                                <h3 className="mb-3 font-semibold">Completed</h3>
                                <div className="space-y-2">
                                    {completedTasks.map((task) => (
                                        <div key={task.id} className="rounded border bg-muted/40 p-2">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{task.title || `Task #${task.id}`}</p>
                                                {hasForwarding(task) && <GitBranch className="h-3 w-3 text-sky-700" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{task.state}</p>
                                        </div>
                                    ))}
                                    {completedTasks.length === 0 && <p className="text-xs text-muted-foreground">No completed tasks.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {taskView === 'gantt' && (
                        <div className="space-y-3">
                            {!ganttBounds && <p className="text-sm text-muted-foreground">No tasks with start and due dates available.</p>}
                            {ganttBounds && (
                                <div
                                    className="space-y-3"
                                    onMouseMove={(e) => handleTaskMouseMove(e, e.currentTarget.offsetWidth)}
                                    onMouseUp={handleTaskMouseUp}
                                    onMouseLeave={handleTaskMouseUp}
                                >
                                    {ganttTasks.map((task) => {
                                        const tempDates = tempTaskDates[task.id];
                                        const startAt = tempDates?.start || (task.start_at as string);
                                        const dueAt = tempDates?.end || (task.due_at as string);
                                        const start = new Date(startAt).getTime();
                                        const end = new Date(dueAt).getTime();
                                        const total = Math.max(1, ganttBounds.max - ganttBounds.min);
                                        const left = ((start - ganttBounds.min) / total) * 100;
                                        const width = Math.max(2, ((end - start) / total) * 100);
                                        const isDragging = draggingTask?.taskId === task.id;
                                        return (
                                            <div key={task.id} className="rounded border p-3">
                                                <div className="mb-2 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{task.title || task.task_code}</p>
                                                        {hasForwarding(task) && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                                                                <GitBranch className="h-3 w-3" />
                                                                Forwarded
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-muted-foreground">
                                                        {formatDate(startAt)} - {formatDate(dueAt)}
                                                    </p>
                                                </div>
                                                <div className="relative h-6 w-full rounded bg-muted">
                                                    {/* Resize handle - left */}
                                                    <div
                                                        className={`absolute top-0 h-6 w-2 cursor-ew-resize rounded-l bg-black/20 hover:bg-black/40 ${isDragging && draggingTask.mode === 'resize-start' ? 'bg-primary' : ''}`}
                                                        style={{ left: `${left}%`, zIndex: 10 }}
                                                        onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize-start')}
                                                    />
                                                    {/* Main bar */}
                                                    <div
                                                        className={`absolute top-0 h-6 cursor-move rounded ${isDragging ? 'opacity-80' : ''}`}
                                                        style={{
                                                            marginLeft: `${left}%`,
                                                            width: `${width}%`,
                                                            backgroundColor: '#3b82f6',
                                                        }}
                                                        onMouseDown={(e) => handleTaskMouseDown(e, task, 'move')}
                                                    />
                                                    {/* Resize handle - right */}
                                                    <div
                                                        className={`absolute top-0 h-6 w-2 cursor-ew-resize rounded-r bg-black/20 hover:bg-black/40 ${isDragging && draggingTask.mode === 'resize-end' ? 'bg-primary' : ''}`}
                                                        style={{ left: `${left + width}%`, zIndex: 10 }}
                                                        onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize-end')}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Drag bars to move • Drag edges to resize
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
