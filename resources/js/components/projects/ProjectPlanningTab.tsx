import axios from 'axios';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProjectPhase } from './types';
import { formatDate } from './utils';

interface ProjectPlanningTabProps {
    projectId: number;
    phases: ProjectPhase[];
    canManagePhases: boolean;
    onPhasesChange: (phases: ProjectPhase[]) => void;
    onSuccess: (message: string) => void;
    onError: (error: unknown, fallback: string) => void;
}

export default function ProjectPlanningTab({
    projectId,
    phases,
    canManagePhases,
    onPhasesChange,
    onSuccess,
    onError,
}: ProjectPlanningTabProps) {
    const [phaseForm, setPhaseForm] = useState({
        name: '',
        description: '',
        status: 'pending',
        start_date: '',
        end_date: '',
        color: '',
    });
    const [draggingPhaseId, setDraggingPhaseId] = useState<number | null>(null);
    const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
    const [phaseEditForm, setPhaseEditForm] = useState({
        name: '',
        description: '',
        status: 'pending',
        start_date: '',
        end_date: '',
        color: '#3b82f6',
        progress: 0,
    });
    const [draggingTimeline, setDraggingTimeline] = useState<{
        phaseId: number;
        mode: 'move' | 'resize-start' | 'resize-end';
        initialX: number;
        initialStart: number;
        initialEnd: number;
    } | null>(null);
    const [tempTimelineDates, setTempTimelineDates] = useState<{
        [phaseId: number]: { start: string; end: string };
    }>({});

    const sortedPhases = useMemo(
        () => [...phases].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        [phases],
    );

    const phaseTimelineBounds = useMemo(() => {
        const timelinePhases = sortedPhases.filter((phase) => phase.start_date && phase.end_date);
        if (!timelinePhases.length) {
            return null;
        }
        const starts = timelinePhases.map((phase) => new Date(phase.start_date as string).getTime());
        const ends = timelinePhases.map((phase) => new Date(phase.end_date as string).getTime());

        return {
            min: Math.min(...starts),
            max: Math.max(...ends),
            timelinePhases,
        };
    }, [sortedPhases]);

    const refreshPhases = async () => {
        const response = await axios.get(`/admin/projects/${projectId}/phases`);
        onPhasesChange(response.data ?? []);
    };

    const handleCreatePhase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`/admin/projects/${projectId}/phases`, {
                ...phaseForm,
                sort_order: phases.length,
            });
            setPhaseForm({
                name: '',
                description: '',
                status: 'pending',
                start_date: '',
                end_date: '',
                color: '',
            });
            await refreshPhases();
            onSuccess('Phase created.');
        } catch (error) {
            onError(error, 'Failed to create phase.');
        }
    };

    const handleDeletePhase = async (phaseId: number) => {
        try {
            await axios.delete(`/admin/projects/${projectId}/phases/${phaseId}`);
            await refreshPhases();
            onSuccess('Phase deleted.');
        } catch (error) {
            onError(error, 'Failed to delete phase.');
        }
    };

    const handlePhaseStatusChange = async (phaseId: number, status: string) => {
        try {
            await axios.patch(`/admin/projects/${projectId}/phases/${phaseId}`, { status });
            await refreshPhases();
            onSuccess('Phase updated.');
        } catch (error) {
            onError(error, 'Failed to update phase.');
        }
    };

    const persistPhaseOrder = async (orderedPhases: ProjectPhase[]) => {
        await axios.post(`/admin/projects/${projectId}/phases/reorder`, {
            phases: orderedPhases.map((phase, sortOrder) => ({
                id: phase.id,
                sort_order: sortOrder,
            })),
        });
        await refreshPhases();
    };

    const reorderPhases = async (phaseId: number, direction: 'up' | 'down') => {
        const sorted = [...sortedPhases];
        const index = sorted.findIndex((phase) => phase.id === phaseId);
        if (index < 0) {
            return;
        }
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= sorted.length) {
            return;
        }

        [sorted[index], sorted[swapIndex]] = [sorted[swapIndex], sorted[index]];

        try {
            await persistPhaseOrder(sorted);
            onSuccess('Phase order updated.');
        } catch (error) {
            onError(error, 'Failed to reorder phases.');
        }
    };

    const handleDropReorder = async (targetPhaseId: number) => {
        if (!canManagePhases || !draggingPhaseId || draggingPhaseId === targetPhaseId) {
            setDraggingPhaseId(null);
            return;
        }

        const sorted = [...sortedPhases];
        const sourceIndex = sorted.findIndex((phase) => phase.id === draggingPhaseId);
        const targetIndex = sorted.findIndex((phase) => phase.id === targetPhaseId);
        if (sourceIndex < 0 || targetIndex < 0) {
            setDraggingPhaseId(null);
            return;
        }

        const [movedPhase] = sorted.splice(sourceIndex, 1);
        sorted.splice(targetIndex, 0, movedPhase);

        try {
            await persistPhaseOrder(sorted);
            onSuccess('Phase order updated.');
        } catch (error) {
            onError(error, 'Failed to reorder phases.');
        } finally {
            setDraggingPhaseId(null);
        }
    };

    const handleStartEdit = (phase: ProjectPhase) => {
        setEditingPhaseId(phase.id);
        setPhaseEditForm({
            name: phase.name,
            description: phase.description ?? '',
            status: phase.status,
            start_date: phase.start_date ? String(phase.start_date).slice(0, 10) : '',
            end_date: phase.end_date ? String(phase.end_date).slice(0, 10) : '',
            color: phase.color ?? '#3b82f6',
            progress: phase.progress ?? 0,
        });
    };

    const handleUpdatePhase = async (phaseId: number) => {
        try {
            await axios.patch(`/admin/projects/${projectId}/phases/${phaseId}`, {
                ...phaseEditForm,
                progress: Number(phaseEditForm.progress) || 0,
            });
            setEditingPhaseId(null);
            await refreshPhases();
            onSuccess('Phase updated.');
        } catch (error) {
            onError(error, 'Failed to update phase.');
        }
    };

    const handleTimelineMouseDown = (
        e: React.MouseEvent,
        phase: ProjectPhase,
        mode: 'move' | 'resize-start' | 'resize-end'
    ) => {
        if (!canManagePhases) return;
        e.preventDefault();
        const start = new Date(phase.start_date as string).getTime();
        const end = new Date(phase.end_date as string).getTime();
        setDraggingTimeline({
            phaseId: phase.id,
            mode,
            initialX: e.clientX,
            initialStart: start,
            initialEnd: end,
        });
    };

    const handleTimelineMouseMove = (e: React.MouseEvent) => {
        if (!draggingTimeline || !phaseTimelineBounds) return;

        const { phaseId, mode, initialX, initialStart, initialEnd } = draggingTimeline;
        const totalSpan = phaseTimelineBounds.max - phaseTimelineBounds.min;
        const pixelsPerMs = (e.currentTarget as HTMLElement).offsetWidth / totalSpan;
        const deltaX = e.clientX - initialX;
        const deltaMs = deltaX / pixelsPerMs;

        let newStart = initialStart;
        let newEnd = initialEnd;

        if (mode === 'move') {
            const duration = initialEnd - initialStart;
            newStart = initialStart + deltaMs;
            newEnd = newStart + duration;
        } else if (mode === 'resize-start') {
            newStart = Math.min(initialStart + deltaMs, initialEnd - 86400000); // At least 1 day
        } else if (mode === 'resize-end') {
            newEnd = Math.max(initialEnd + deltaMs, initialStart + 86400000); // At least 1 day
        }

        const newStartDate = new Date(newStart);
        const newEndDate = new Date(newEnd);

        // Format as YYYY-MM-DD
        const formatYMD = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        setTempTimelineDates((prev) => ({
            ...prev,
            [phaseId]: {
                start: formatYMD(newStartDate),
                end: formatYMD(newEndDate),
            },
        }));
    };

    const handleTimelineMouseUp = async () => {
        if (!draggingTimeline || !tempTimelineDates[draggingTimeline.phaseId]) {
            setDraggingTimeline(null);
            return;
        }

        const { phaseId } = draggingTimeline;
        const newDates = tempTimelineDates[phaseId];

        try {
            await axios.patch(`/admin/projects/${projectId}/phases/${phaseId}`, {
                start_date: newDates.start,
                end_date: newDates.end,
            });
            await refreshPhases();
            onSuccess('Phase dates updated.');
        } catch (error) {
            onError(error, 'Failed to update phase dates.');
        } finally {
            setDraggingTimeline(null);
            setTempTimelineDates((prev) => {
                const next = { ...prev };
                delete next[phaseId];
                return next;
            });
        }
    };

    return (
        <div className="space-y-4">
            {canManagePhases && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Phase</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreatePhase} className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Phase Name</Label>
                                <Input required value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    className="h-10 w-full rounded border bg-background px-3"
                                    value={phaseForm.status}
                                    onChange={(e) => setPhaseForm({ ...phaseForm, status: e.target.value })}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="on_hold">On Hold</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Start</Label>
                                <Input type="date" value={phaseForm.start_date} onChange={(e) => setPhaseForm({ ...phaseForm, start_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>End</Label>
                                <Input type="date" value={phaseForm.end_date} onChange={(e) => setPhaseForm({ ...phaseForm, end_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <Input type="color" value={phaseForm.color || '#3b82f6'} onChange={(e) => setPhaseForm({ ...phaseForm, color: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <Label>Description</Label>
                                <Textarea value={phaseForm.description} onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-3">
                                <Button type="submit">Add Phase</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Phases</CardTitle>
                    <CardDescription>Manage order, details, and status by phase.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sortedPhases.map((phase) => (
                        <div
                            key={phase.id}
                            className={`rounded border p-3 ${draggingPhaseId === phase.id ? 'border-primary bg-muted/50' : ''}`}
                            draggable={canManagePhases}
                            onDragStart={() => setDraggingPhaseId(phase.id)}
                            onDragOver={(e) => {
                                if (canManagePhases) {
                                    e.preventDefault();
                                }
                            }}
                            onDrop={() => void handleDropReorder(phase.id)}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    {canManagePhases && <GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                                    <div>
                                        <p className="font-medium">{phase.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(phase.start_date)} - {formatDate(phase.end_date)} | {phase.tasks_count ?? 0} tasks
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{phase.progress ?? 0}%</Badge>
                                    <Badge variant="secondary">{phase.status}</Badge>
                                    {canManagePhases && (
                                        <>
                                            <Button size="icon" variant="outline" onClick={() => void reorderPhases(phase.id, 'up')}>
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" onClick={() => void reorderPhases(phase.id, 'down')}>
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <select
                                                className="h-9 rounded border bg-background px-2 text-sm"
                                                value={phase.status}
                                                onChange={(e) => void handlePhaseStatusChange(phase.id, e.target.value)}
                                            >
                                                <option value="pending">pending</option>
                                                <option value="active">active</option>
                                                <option value="completed">completed</option>
                                                <option value="on_hold">on_hold</option>
                                            </select>
                                            <Button size="sm" variant="outline" onClick={() => handleStartEdit(phase)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button size="icon" variant="destructive" onClick={() => void handleDeletePhase(phase.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {editingPhaseId === phase.id && canManagePhases && (
                                <div className="mt-3 grid gap-3 rounded border bg-muted/40 p-3 md:grid-cols-3">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Name</Label>
                                        <Input value={phaseEditForm.name} onChange={(e) => setPhaseEditForm({ ...phaseEditForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select
                                            className="h-10 w-full rounded border bg-background px-3"
                                            value={phaseEditForm.status}
                                            onChange={(e) => setPhaseEditForm({ ...phaseEditForm, status: e.target.value })}
                                        >
                                            <option value="pending">pending</option>
                                            <option value="active">active</option>
                                            <option value="completed">completed</option>
                                            <option value="on_hold">on_hold</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start</Label>
                                        <Input
                                            type="date"
                                            value={phaseEditForm.start_date}
                                            onChange={(e) => setPhaseEditForm({ ...phaseEditForm, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End</Label>
                                        <Input
                                            type="date"
                                            value={phaseEditForm.end_date}
                                            onChange={(e) => setPhaseEditForm({ ...phaseEditForm, end_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Progress %</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={phaseEditForm.progress}
                                            onChange={(e) => setPhaseEditForm({ ...phaseEditForm, progress: Number(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Color</Label>
                                        <Input
                                            type="color"
                                            value={phaseEditForm.color || '#3b82f6'}
                                            onChange={(e) => setPhaseEditForm({ ...phaseEditForm, color: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-3">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={phaseEditForm.description}
                                            onChange={(e) => setPhaseEditForm({ ...phaseEditForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2 md:col-span-3">
                                        <Button type="button" onClick={() => void handleUpdatePhase(phase.id)}>
                                            Save Changes
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setEditingPhaseId(null)}>
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {phases.length === 0 && <p className="text-sm text-muted-foreground">No phases created.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Phase Timeline</CardTitle>
                    <CardDescription>Visual timeline for phases with both start and end dates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!phaseTimelineBounds && <p className="text-sm text-muted-foreground">Add start and end dates to phases to view the timeline.</p>}
                    {phaseTimelineBounds && (
                        <div
                            className="space-y-3"
                            onMouseMove={handleTimelineMouseMove}
                            onMouseUp={handleTimelineMouseUp}
                            onMouseLeave={handleTimelineMouseUp}
                        >
                            {phaseTimelineBounds.timelinePhases.map((phase) => {
                                const tempDates = tempTimelineDates[phase.id];
                                const startDate = tempDates?.start || (phase.start_date as string);
                                const endDate = tempDates?.end || (phase.end_date as string);
                                const start = new Date(startDate).getTime();
                                const end = new Date(endDate).getTime();
                                const totalSpan = Math.max(1, phaseTimelineBounds.max - phaseTimelineBounds.min);
                                const left = ((start - phaseTimelineBounds.min) / totalSpan) * 100;
                                const width = Math.max(3, ((end - start) / totalSpan) * 100);
                                const isDragging = draggingTimeline?.phaseId === phase.id;
                                return (
                                    <div key={`timeline-${phase.id}`} className="rounded border p-3">
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <p className="font-medium">{phase.name}</p>
                                            <p className="text-muted-foreground">
                                                {formatDate(startDate)} - {formatDate(endDate)}
                                            </p>
                                        </div>
                                        <div className="relative h-6 w-full rounded bg-muted">
                                            {/* Resize handle - left */}
                                            {canManagePhases && (
                                                <div
                                                    className={`absolute top-0 h-6 w-2 cursor-ew-resize rounded-l bg-black/20 hover:bg-black/40 ${isDragging && draggingTimeline.mode === 'resize-start' ? 'bg-primary' : ''}`}
                                                    style={{ left: `${left}%`, zIndex: 10 }}
                                                    onMouseDown={(e) => handleTimelineMouseDown(e, phase, 'resize-start')}
                                                />
                                            )}
                                            {/* Main bar */}
                                            <div
                                                className={`absolute top-0 h-6 rounded ${canManagePhases ? 'cursor-move' : ''} ${isDragging ? 'opacity-80' : ''}`}
                                                style={{
                                                    marginLeft: `${left}%`,
                                                    width: `${width}%`,
                                                    backgroundColor: phase.color ?? '#3b82f6',
                                                }}
                                                onMouseDown={(e) => canManagePhases && handleTimelineMouseDown(e, phase, 'move')}
                                            >
                                                {/* Progress indicator */}
                                                {phase.progress !== undefined && phase.progress > 0 && (
                                                    <div
                                                        className="h-full rounded bg-black/30"
                                                        style={{ width: `${Math.min(100, phase.progress)}%` }}
                                                    />
                                                )}
                                            </div>
                                            {/* Resize handle - right */}
                                            {canManagePhases && (
                                                <div
                                                    className={`absolute top-0 h-6 w-2 cursor-ew-resize rounded-r bg-black/20 hover:bg-black/40 ${isDragging && draggingTimeline.mode === 'resize-end' ? 'bg-primary' : ''}`}
                                                    style={{ left: `${left + width}%`, zIndex: 10 }}
                                                    onMouseDown={(e) => handleTimelineMouseDown(e, phase, 'resize-end')}
                                                />
                                            )}
                                        </div>
                                        {canManagePhases && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Drag bars to move • Drag edges to resize
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
