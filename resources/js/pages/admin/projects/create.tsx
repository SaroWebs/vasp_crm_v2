import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Projects', href: '/admin/projects' },
    { title: 'Create', href: '/admin/projects/create' },
];

interface SelectOption {
    id: number;
    name: string;
    email?: string;
}

interface TeamMemberInput {
    user_id: string;
    role: 'owner' | 'manager' | 'member' | 'viewer';
}

interface ProjectCreateProps {
    statusOptions: Record<string, string>;
    priorityOptions: Record<string, string>;
    roleOptions: Record<string, string>;
    managers: SelectOption[];
    departments: SelectOption[];
    users: SelectOption[];
}

interface ProjectFormData {
    name: string;
    code: string;
    description: string;
    department_id: string;
    manager_id: string;
    status: string;
    priority: string;
    start_date: string;
    end_date: string;
    budget: string;
    team_members: TeamMemberInput[];
}

export default function CreateProject({
    statusOptions,
    priorityOptions,
    roleOptions,
    managers,
    departments,
    users,
}: ProjectCreateProps) {
    const { data, setData, post, processing, errors, transform } = useForm<ProjectFormData>({
        name: '',
        code: '',
        description: '',
        department_id: '',
        manager_id: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        end_date: '',
        budget: '',
        team_members: [],
    });

    const [selectedTeamUserId, setSelectedTeamUserId] = useState('');
    const [selectedTeamRole, setSelectedTeamRole] = useState<TeamMemberInput['role']>('member');

    const selectedTeamUserIds = useMemo(
        () => new Set(data.team_members.map((member) => member.user_id)),
        [data.team_members],
    );

    const addTeamMember = () => {
        if (!selectedTeamUserId || selectedTeamUserIds.has(selectedTeamUserId)) {
            return;
        }

        setData('team_members', [
            ...data.team_members,
            {
                user_id: selectedTeamUserId,
                role: selectedTeamRole,
            },
        ]);

        setSelectedTeamUserId('');
        setSelectedTeamRole('member');
    };

    const removeTeamMember = (userId: string) => {
        setData(
            'team_members',
            data.team_members.filter((member) => member.user_id !== userId),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((currentData) => ({
            ...currentData,
            department_id: currentData.department_id ? Number(currentData.department_id) : null,
            manager_id: currentData.manager_id ? Number(currentData.manager_id) : null,
            budget: currentData.budget !== '' ? Number(currentData.budget) : null,
            team_members: currentData.team_members.map((member) => ({
                user_id: Number(member.user_id),
                role: member.role,
            })),
        }));

        post('/admin/projects');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Project" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
                        <p className="text-muted-foreground">Set up a project with planning and team details.</p>
                    </div>
                    <Link href="/admin/projects">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Project identity and summary fields.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Project Name *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Code</Label>
                                <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="PRJ-001" />
                                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Priority *</Label>
                                <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(priorityOptions).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.priority && <p className="text-sm text-red-500">{errors.priority}</p>}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Scheduling and Ownership</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Status *</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusOptions).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Manager</Label>
                                <Select value={data.manager_id || 'none'} onValueChange={(value) => setData('manager_id', value === 'none' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {managers.map((manager) => (
                                            <SelectItem key={manager.id} value={String(manager.id)}>
                                                {manager.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.manager_id && <p className="text-sm text-red-500">{errors.manager_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select value={data.department_id || 'none'} onValueChange={(value) => setData('department_id', value === 'none' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem key={department.id} value={String(department.id)}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.department_id && <p className="text-sm text-red-500">{errors.department_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    step="0.01"
                                    value={data.budget}
                                    onChange={(e) => setData('budget', e.target.value)}
                                />
                                {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                                {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                                {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Add users to the initial project team.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="md:col-span-2">
                                    <Label>User</Label>
                                    <Select value={selectedTeamUserId || 'none'} onValueChange={(value) => setSelectedTeamUserId(value === 'none' ? '' : value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={String(user.id)}
                                                    disabled={selectedTeamUserIds.has(String(user.id))}
                                                >
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Role</Label>
                                    <Select value={selectedTeamRole} onValueChange={(value) => setSelectedTeamRole(value as TeamMemberInput['role'])}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roleOptions).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="button" variant="outline" onClick={addTeamMember}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Team Member
                            </Button>

                            <div className="space-y-2">
                                {data.team_members.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No team members selected yet.</p>
                                )}
                                {data.team_members.map((member) => {
                                    const user = users.find((item) => String(item.id) === member.user_id);
                                    return (
                                        <div key={member.user_id} className="flex items-center justify-between rounded border px-3 py-2">
                                            <div>
                                                <p className="text-sm font-medium">{user?.name ?? member.user_id}</p>
                                                <p className="text-xs text-muted-foreground">{roleOptions[member.role] ?? member.role}</p>
                                            </div>
                                            <Button type="button" size="icon" variant="ghost" onClick={() => removeTeamMember(member.user_id)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.team_members && <p className="text-sm text-red-500">{errors.team_members}</p>}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/admin/projects">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
