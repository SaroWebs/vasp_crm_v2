import axios from 'axios';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProjectMilestone } from './types';
import { formatDate } from './utils';

interface ProjectMilestonesTabProps {
    projectId: number;
    milestones: ProjectMilestone[];
    canManageMilestones: boolean;
    onMilestonesChange: (milestones: ProjectMilestone[]) => void;
    onSuccess: (message: string) => void;
    onError: (error: unknown, fallback: string) => void;
}

export default function ProjectMilestonesTab({
    projectId,
    milestones,
    canManageMilestones,
    onMilestonesChange,
    onSuccess,
    onError,
}: ProjectMilestonesTabProps) {
    const [milestoneForm, setMilestoneForm] = useState({
        name: '',
        description: '',
        target_date: '',
        type: 'custom',
    });
    const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
    const [milestoneEditForm, setMilestoneEditForm] = useState({
        name: '',
        description: '',
        target_date: '',
        type: 'custom',
        status: 'pending',
        progress: 0,
    });

    const sortedMilestones = useMemo(
        () => [...milestones].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        [milestones],
    );

    const milestoneTimelineBounds = useMemo(() => {
        const dated = sortedMilestones.filter((milestone) => milestone.target_date);
        if (!dated.length) {
            return null;
        }
        const values = dated.map((milestone) => new Date(milestone.target_date as string).getTime());
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            items: dated,
        };
    }, [sortedMilestones]);

    const refreshMilestones = async () => {
        const response = await axios.get(`/admin/projects/${projectId}/milestones`);
        onMilestonesChange(response.data ?? []);
    };

    const handleCreateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`/admin/projects/${projectId}/milestones`, {
                ...milestoneForm,
                sort_order: milestones.length,
            });
            setMilestoneForm({
                name: '',
                description: '',
                target_date: '',
                type: 'custom',
            });
            await refreshMilestones();
            onSuccess('Milestone created.');
        } catch (error) {
            onError(error, 'Failed to create milestone.');
        }
    };

    const handleMilestoneComplete = async (milestoneId: number) => {
        try {
            await axios.post(`/admin/projects/${projectId}/milestones/${milestoneId}/complete`);
            await refreshMilestones();
            onSuccess('Milestone marked completed.');
        } catch (error) {
            onError(error, 'Failed to complete milestone.');
        }
    };

    const handleDeleteMilestone = async (milestoneId: number) => {
        try {
            await axios.delete(`/admin/projects/${projectId}/milestones/${milestoneId}`);
            await refreshMilestones();
            onSuccess('Milestone deleted.');
        } catch (error) {
            onError(error, 'Failed to delete milestone.');
        }
    };

    const handleStartEditMilestone = (milestone: ProjectMilestone) => {
        setEditingMilestoneId(milestone.id);
        setMilestoneEditForm({
            name: milestone.name,
            description: milestone.description ?? '',
            target_date: milestone.target_date ? String(milestone.target_date).slice(0, 10) : '',
            type: milestone.type,
            status: milestone.status,
            progress: milestone.progress ?? 0,
        });
    };

    const handleUpdateMilestone = async (milestoneId: number) => {
        try {
            await axios.patch(`/admin/projects/${projectId}/milestones/${milestoneId}`, {
                ...milestoneEditForm,
                progress: Number(milestoneEditForm.progress) || 0,
            });
            setEditingMilestoneId(null);
            await refreshMilestones();
            onSuccess('Milestone updated.');
        } catch (error) {
            onError(error, 'Failed to update milestone.');
        }
    };

    const reorderMilestones = async (milestoneId: number, direction: 'up' | 'down') => {
        const sorted = [...sortedMilestones];
        const index = sorted.findIndex((milestone) => milestone.id === milestoneId);
        if (index < 0) {
            return;
        }
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= sorted.length) {
            return;
        }

        [sorted[index], sorted[swapIndex]] = [sorted[swapIndex], sorted[index]];

        try {
            await axios.post(`/admin/projects/${projectId}/milestones/reorder`, {
                milestones: sorted.map((milestone, sortOrder) => ({
                    id: milestone.id,
                    sort_order: sortOrder,
                })),
            });
            await refreshMilestones();
            onSuccess('Milestone order updated.');
        } catch (error) {
            onError(error, 'Failed to reorder milestones.');
        }
    };

    return (
        <div className="space-y-4">
            {canManageMilestones && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Milestone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateMilestone} className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Name</Label>
                                <Input required value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                    className="h-10 w-full rounded border bg-background px-3"
                                    value={milestoneForm.type}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, type: e.target.value })}
                                >
                                    <option value="start">start</option>
                                    <option value="checkpoint">checkpoint</option>
                                    <option value="delivery">delivery</option>
                                    <option value="completion">completion</option>
                                    <option value="custom">custom</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Target Date</Label>
                                <Input
                                    required
                                    type="date"
                                    value={milestoneForm.target_date}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, target_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-3">
                                <Button type="submit">Add Milestone</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Milestone Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!milestoneTimelineBounds && <p className="text-sm text-muted-foreground">Set milestone target dates to view timeline progression.</p>}
                    {milestoneTimelineBounds && (
                        <>
                            <div className="relative h-10 rounded bg-muted">
                                {milestoneTimelineBounds.items.map((milestone) => {
                                    const current = new Date(milestone.target_date as string).getTime();
                                    const totalSpan = Math.max(1, milestoneTimelineBounds.max - milestoneTimelineBounds.min);
                                    const left = ((current - milestoneTimelineBounds.min) / totalSpan) * 100;
                                    const markerColor = milestone.status === 'completed' ? 'bg-green-500' : milestone.status === 'overdue' ? 'bg-red-500' : 'bg-primary';

                                    return (
                                        <div
                                            key={`timeline-${milestone.id}`}
                                            className="absolute top-1/2"
                                            style={{ left: `${Math.min(98, Math.max(1, left))}%`, transform: 'translate(-50%, -50%)' }}
                                            title={`${milestone.name} (${formatDate(milestone.target_date)})`}
                                        >
                                            <div className={`h-3 w-3 rounded-full ${markerColor}`} />
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="space-y-2">
                                {milestoneTimelineBounds.items.map((milestone) => (
                                    <div key={`timeline-label-${milestone.id}`} className="flex items-center justify-between text-sm">
                                        <p className="font-medium">{milestone.name}</p>
                                        <p className="text-muted-foreground">{formatDate(milestone.target_date)}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Milestones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sortedMilestones.map((milestone) => (
                        <div key={milestone.id} className="rounded border p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">{milestone.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {milestone.type} | target {formatDate(milestone.target_date)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{milestone.status}</Badge>
                                    <Badge variant="secondary">{milestone.progress ?? 0}%</Badge>
                                    {canManageMilestones && (
                                        <>
                                            <Button size="icon" variant="outline" onClick={() => void reorderMilestones(milestone.id, 'up')}>
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" onClick={() => void reorderMilestones(milestone.id, 'down')}>
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleStartEditMilestone(milestone)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                            {milestone.status !== 'completed' && (
                                                <Button size="sm" variant="outline" onClick={() => void handleMilestoneComplete(milestone.id)}>
                                                    Complete
                                                </Button>
                                            )}
                                            <Button size="icon" variant="destructive" onClick={() => void handleDeleteMilestone(milestone.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 h-2 w-full rounded bg-muted">
                                <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, Math.max(0, milestone.progress ?? 0))}%` }} />
                            </div>

                            {editingMilestoneId === milestone.id && canManageMilestones && (
                                <div className="mt-3 grid gap-3 rounded border bg-muted/40 p-3 md:grid-cols-3">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={milestoneEditForm.name}
                                            onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            className="h-10 w-full rounded border bg-background px-3"
                                            value={milestoneEditForm.type}
                                            onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, type: e.target.value })}
                                        >
                                            <option value="start">start</option>
                                            <option value="checkpoint">checkpoint</option>
                                            <option value="delivery">delivery</option>
                                            <option value="completion">completion</option>
                                            <option value="custom">custom</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Date</Label>
                                        <Input
                                            type="date"
                                            value={milestoneEditForm.target_date}
                                            onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, target_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select
                                            className="h-10 w-full rounded border bg-background px-3"
                                            value={milestoneEditForm.status}
                                            onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, status: e.target.value })}
                                        >
                                            <option value="pending">pending</option>
                                            <option value="in_progress">in_progress</option>
                                            <option value="completed">completed</option>
                                            <option value="overdue">overdue</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Progress %</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={milestoneEditForm.progress}
                                            onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, progress: Number(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-3">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={milestoneEditForm.description}
                                            onChange={(e) => setMilestoneEditForm({ ...milestoneEditForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2 md:col-span-3">
                                        <Button type="button" onClick={() => void handleUpdateMilestone(milestone.id)}>
                                            Save Changes
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setEditingMilestoneId(null)}>
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {milestones.length === 0 && <p className="text-sm text-muted-foreground">No milestones created.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
