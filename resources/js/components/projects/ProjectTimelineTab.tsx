import axios from 'axios';
import { useMemo, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProjectPhase, ProjectTimelineEvent } from './types';
import { formatDateTime } from './utils';

interface ProjectTimelineTabProps {
    projectId: number;
    phases: ProjectPhase[];
    timelineEvents: ProjectTimelineEvent[];
    canManageTimeline: boolean;
    onTimelineChange: (events: ProjectTimelineEvent[]) => void;
    onSuccess: (message: string) => void;
    onError: (error: unknown, fallback: string) => void;
}

export default function ProjectTimelineTab({
    projectId,
    phases,
    timelineEvents,
    canManageTimeline,
    onTimelineChange,
    onSuccess,
    onError,
}: ProjectTimelineTabProps) {
    const [timelineForm, setTimelineForm] = useState({
        phase_id: '',
        event_type: 'custom',
        event_name: '',
        event_description: '',
        event_date: '',
        is_milestone: false,
    });
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [eventEditForm, setEventEditForm] = useState({
        phase_id: '',
        event_type: 'custom',
        event_name: '',
        event_description: '',
        event_date: '',
        is_milestone: false,
    });

    const phaseById = useMemo(() => {
        const map = new Map<number, ProjectPhase>();
        phases.forEach((phase) => map.set(phase.id, phase));
        return map;
    }, [phases]);

    const sortedTimelineEvents = useMemo(
        () => [...timelineEvents].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()),
        [timelineEvents],
    );

    const activityItems = useMemo(() => {
        const items: Array<{ id: string; timestamp: string; title: string; detail: string }> = [];

        sortedTimelineEvents.forEach((event) => {
            const actor = event.user?.name ?? 'System';
            if (event.created_at) {
                items.push({
                    id: `created-${event.id}`,
                    timestamp: event.created_at,
                    title: `${actor} created timeline event`,
                    detail: event.event_name,
                });
            }

            if (event.updated_at && event.created_at && event.updated_at !== event.created_at) {
                items.push({
                    id: `updated-${event.id}`,
                    timestamp: event.updated_at,
                    title: `${actor} updated timeline event`,
                    detail: event.event_name,
                });
            }

            if (event.is_completed && event.completed_at) {
                items.push({
                    id: `completed-${event.id}`,
                    timestamp: event.completed_at,
                    title: `${actor} completed timeline event`,
                    detail: event.event_name,
                });
            }
        });

        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [sortedTimelineEvents]);

    const refreshTimeline = async () => {
        const response = await axios.get(`/admin/projects/${projectId}/timeline`);
        onTimelineChange(response.data ?? []);
    };

    const handleCreateTimelineEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`/admin/projects/${projectId}/timeline`, {
                ...timelineForm,
                phase_id: timelineForm.phase_id ? Number(timelineForm.phase_id) : null,
            });
            setTimelineForm({
                phase_id: '',
                event_type: 'custom',
                event_name: '',
                event_description: '',
                event_date: '',
                is_milestone: false,
            });
            await refreshTimeline();
            onSuccess('Timeline event created.');
        } catch (error) {
            onError(error, 'Failed to create timeline event.');
        }
    };

    const handleCompleteTimelineEvent = async (eventId: number) => {
        try {
            await axios.post(`/admin/projects/${projectId}/timeline/${eventId}/complete`);
            await refreshTimeline();
            onSuccess('Timeline event completed.');
        } catch (error) {
            onError(error, 'Failed to complete timeline event.');
        }
    };

    const handleDeleteTimelineEvent = async (eventId: number) => {
        try {
            await axios.delete(`/admin/projects/${projectId}/timeline/${eventId}`);
            await refreshTimeline();
            onSuccess('Timeline event deleted.');
        } catch (error) {
            onError(error, 'Failed to delete timeline event.');
        }
    };

    const handleStartEditEvent = (event: ProjectTimelineEvent) => {
        setEditingEventId(event.id);
        setEventEditForm({
            phase_id: event.phase_id ? String(event.phase_id) : '',
            event_type: event.event_type,
            event_name: event.event_name,
            event_description: event.event_description ?? '',
            event_date: event.event_date ? String(event.event_date).slice(0, 16) : '',
            is_milestone: Boolean(event.is_milestone),
        });
    };

    const handleUpdateTimelineEvent = async (eventId: number) => {
        try {
            await axios.patch(`/admin/projects/${projectId}/timeline/${eventId}`, {
                ...eventEditForm,
                phase_id: eventEditForm.phase_id ? Number(eventEditForm.phase_id) : null,
            });
            setEditingEventId(null);
            await refreshTimeline();
            onSuccess('Timeline event updated.');
        } catch (error) {
            onError(error, 'Failed to update timeline event.');
        }
    };

    return (
        <div className="space-y-4">
            {canManageTimeline && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Timeline Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateTimelineEvent} className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Input required value={timelineForm.event_type} onChange={(e) => setTimelineForm({ ...timelineForm, event_type: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Event Name</Label>
                                <Input required value={timelineForm.event_name} onChange={(e) => setTimelineForm({ ...timelineForm, event_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phase</Label>
                                <select
                                    className="h-10 w-full rounded border bg-background px-3"
                                    value={timelineForm.phase_id}
                                    onChange={(e) => setTimelineForm({ ...timelineForm, phase_id: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {phases.map((phase) => (
                                        <option key={phase.id} value={phase.id}>
                                            {phase.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date/Time</Label>
                                <Input
                                    required
                                    type="datetime-local"
                                    value={timelineForm.event_date}
                                    onChange={(e) => setTimelineForm({ ...timelineForm, event_date: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={timelineForm.is_milestone}
                                        onChange={(e) => setTimelineForm({ ...timelineForm, is_milestone: e.target.checked })}
                                    />
                                    Milestone Event
                                </label>
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <Label>Description</Label>
                                <Textarea
                                    value={timelineForm.event_description}
                                    onChange={(e) => setTimelineForm({ ...timelineForm, event_description: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Button type="submit">Add Event</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Timeline Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sortedTimelineEvents.map((event) => (
                        <div key={event.id} className="rounded border p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">{event.event_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {event.event_type} | {formatDateTime(event.event_date)}
                                        {event.phase_id ? ` | ${phaseById.get(event.phase_id)?.name ?? 'Phase'}` : ''}
                                    </p>
                                    {event.event_description && <p className="mt-1 text-sm text-muted-foreground">{event.event_description}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{event.is_completed ? 'completed' : 'open'}</Badge>
                                    {event.is_milestone && <Badge variant="secondary">milestone</Badge>}
                                    {canManageTimeline && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => handleStartEditEvent(event)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                            {!event.is_completed && (
                                                <Button size="sm" variant="outline" onClick={() => void handleCompleteTimelineEvent(event.id)}>
                                                    Complete
                                                </Button>
                                            )}
                                            <Button size="icon" variant="destructive" onClick={() => void handleDeleteTimelineEvent(event.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {editingEventId === event.id && canManageTimeline && (
                                <div className="mt-3 grid gap-3 rounded border bg-muted/40 p-3 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Input value={eventEditForm.event_type} onChange={(e) => setEventEditForm({ ...eventEditForm, event_type: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Event Name</Label>
                                        <Input value={eventEditForm.event_name} onChange={(e) => setEventEditForm({ ...eventEditForm, event_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phase</Label>
                                        <select
                                            className="h-10 w-full rounded border bg-background px-3"
                                            value={eventEditForm.phase_id}
                                            onChange={(e) => setEventEditForm({ ...eventEditForm, phase_id: e.target.value })}
                                        >
                                            <option value="">None</option>
                                            {phases.map((phase) => (
                                                <option key={phase.id} value={phase.id}>
                                                    {phase.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date/Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={eventEditForm.event_date}
                                            onChange={(e) => setEventEditForm({ ...eventEditForm, event_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={eventEditForm.is_milestone}
                                                onChange={(e) => setEventEditForm({ ...eventEditForm, is_milestone: e.target.checked })}
                                            />
                                            Milestone Event
                                        </label>
                                    </div>
                                    <div className="space-y-2 md:col-span-3">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={eventEditForm.event_description}
                                            onChange={(e) => setEventEditForm({ ...eventEditForm, event_description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2 md:col-span-3">
                                        <Button type="button" onClick={() => void handleUpdateTimelineEvent(event.id)}>
                                            Save Changes
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setEditingEventId(null)}>
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {timelineEvents.length === 0 && <p className="text-sm text-muted-foreground">No timeline events found.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {activityItems.map((item) => (
                        <div key={item.id} className="rounded border p-3">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.detail}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.timestamp)}</p>
                        </div>
                    ))}
                    {activityItems.length === 0 && <p className="text-sm text-muted-foreground">No activity captured yet.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
