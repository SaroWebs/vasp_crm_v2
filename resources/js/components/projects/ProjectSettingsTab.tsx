import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamRole, UserOption, ProjectTeamMember } from './types';

interface ProjectSettingsTabProps {
    projectId: number;
    projectName: string;
    users: UserOption[];
    roleOptions: Record<TeamRole, string>;
    team: ProjectTeamMember[];
    canManageTeam: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onTeamChange: (team: ProjectTeamMember[]) => void;
    onSuccess: (message: string) => void;
    onError: (error: unknown, fallback: string) => void;
}

export default function ProjectSettingsTab({
    projectId,
    projectName,
    users,
    roleOptions,
    team,
    canManageTeam,
    canEdit,
    canDelete,
    onTeamChange,
    onSuccess,
    onError,
}: ProjectSettingsTabProps) {
    const refreshTeam = async () => {
        const response = await axios.get(`/admin/projects/${projectId}/team`);
        onTeamChange(response.data ?? []);
    };

    const handleAddTeamMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const userId = form.get('user_id')?.toString() ?? '';
        const role = (form.get('role')?.toString() ?? 'member') as TeamRole;

        if (!userId) {
            onError(null, 'Select a user to add.');
            return;
        }

        try {
            await axios.post(`/admin/projects/${projectId}/team`, {
                user_id: Number(userId),
                role,
            });
            e.currentTarget.reset();
            await refreshTeam();
            onSuccess('Team member added.');
        } catch (error) {
            onError(error, 'Failed to add team member.');
        }
    };

    const handleUpdateTeamMemberRole = async (userId: number, role: TeamRole) => {
        try {
            await axios.patch(`/admin/projects/${projectId}/team/${userId}`, { role });
            await refreshTeam();
            onSuccess('Team role updated.');
        } catch (error) {
            onError(error, 'Failed to update team role.');
        }
    };

    const handleRemoveTeamMember = async (userId: number) => {
        try {
            await axios.delete(`/admin/projects/${projectId}/team/${userId}`);
            await refreshTeam();
            onSuccess('Team member removed.');
        } catch (error) {
            onError(error, 'Failed to remove team member.');
        }
    };

    const handleDeleteProject = () => {
        if (!window.confirm(`Delete project "${projectName}"?`)) {
            return;
        }

        router.delete(`/admin/projects/${projectId}`, {
            onSuccess: () => {
                router.visit('/admin/projects');
            },
        });
    };

    const handleRecalculateProgress = async () => {
        try {
            await axios.post(`/admin/projects/${projectId}/progress`);
            onSuccess('Project progress recalculated.');
        } catch (error) {
            onError(error, 'Failed to update progress.');
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Team Management</CardTitle>
                    <CardDescription>Add, update, or remove project members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {canManageTeam && (
                        <form onSubmit={handleAddTeamMember} className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">User</label>
                                <select name="user_id" className="h-10 w-full rounded border bg-background px-3">
                                    <option value="">Select user</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email ?? 'no-email'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <select name="role" className="h-10 w-full rounded border bg-background px-3" defaultValue="member">
                                    {Object.entries(roleOptions).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <Button type="submit">Add Member</Button>
                            </div>
                        </form>
                    )}

                    {team.map((member) => (
                        <div key={`${member.user_id}-${member.role}`} className="flex items-center justify-between rounded border p-3">
                            <div>
                                <p className="font-medium">{member.user?.name ?? `User #${member.user_id}`}</p>
                                <p className="text-xs text-muted-foreground">{member.user?.email ?? ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {canManageTeam ? (
                                    <select
                                        className="h-9 rounded border bg-background px-2 text-sm"
                                        value={member.role}
                                        onChange={(e) => handleUpdateTeamMemberRole(member.user_id, e.target.value as TeamRole)}
                                    >
                                        {Object.entries(roleOptions).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <Badge variant="outline">{member.role}</Badge>
                                )}
                                {canManageTeam && (
                                    <Button size="icon" variant="destructive" onClick={() => handleRemoveTeamMember(member.user_id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {team.length === 0 && <p className="text-sm text-muted-foreground">No team members assigned.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Project Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {canEdit && (
                        <Button variant="outline" onClick={() => void handleRecalculateProgress()}>
                            Recalculate Progress
                        </Button>
                    )}
                    {canDelete && <Button variant="destructive" onClick={handleDeleteProject}>Delete Project</Button>}
                </CardContent>
            </Card>
        </div>
    );
}
