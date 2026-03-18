import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Projects', href: '/admin/projects' },
];

interface ProjectListItem {
    id: number;
    name: string;
    code: string | null;
    status: string;
    priority: string;
    progress: number;
    start_date: string | null;
    end_date: string | null;
    manager?: { id: number; name: string } | null;
    department?: { id: number; name: string } | null;
    tasks_count?: number;
    milestones_count?: number;
}

interface PaginatedProjects {
    data: ProjectListItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface SelectOption {
    id: number;
    name: string;
}

interface ProjectIndexProps {
    projects: PaginatedProjects;
    filters: Record<string, string>;
    statusOptions: Record<string, string>;
    priorityOptions: Record<string, string>;
    managers: SelectOption[];
    departments: SelectOption[];
    userPermissions?: string[];
}

export default function ProjectIndex({
    projects,
    filters,
    statusOptions,
    priorityOptions,
    managers,
    departments,
    userPermissions = [],
}: ProjectIndexProps) {
    const [formFilters, setFormFilters] = useState({
        search: filters.search ?? '',
        status: filters.status ?? '',
        priority: filters.priority ?? '',
        manager_id: filters.manager_id ?? '',
        department_id: filters.department_id ?? '',
        start_date_from: filters.start_date_from ?? '',
        end_date_to: filters.end_date_to ?? '',
    });

    const canCreate = userPermissions.includes('project.create');
    const canUpdate = userPermissions.includes('project.update');
    const canDelete = userPermissions.includes('project.delete');

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/projects', formFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const resetFilters = {
            search: '',
            status: '',
            priority: '',
            manager_id: '',
            department_id: '',
            start_date_from: '',
            end_date_to: '',
        };
        setFormFilters(resetFilters);
        router.get('/admin/projects', resetFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const deleteProject = (projectId: number) => {
        if (!window.confirm('Delete this project? This can be restored later.')) {
            return;
        }

        router.delete(`/admin/projects/${projectId}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                        <p className="text-muted-foreground">Plan and track project delivery.</p>
                    </div>
                    {canCreate && (
                        <Link href="/admin/projects/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Project
                            </Button>
                        </Link>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={formFilters.search}
                                        onChange={(e) => setFormFilters({ ...formFilters, search: e.target.value })}
                                        placeholder="Search by name or code"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formFilters.status || 'all'}
                                    onValueChange={(value) => setFormFilters({ ...formFilters, status: value === 'all' ? '' : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {Object.entries(statusOptions).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={formFilters.priority || 'all'}
                                    onValueChange={(value) => setFormFilters({ ...formFilters, priority: value === 'all' ? '' : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {Object.entries(priorityOptions).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Manager</Label>
                                <Select
                                    value={formFilters.manager_id || 'all'}
                                    onValueChange={(value) => setFormFilters({ ...formFilters, manager_id: value === 'all' ? '' : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {managers.map((manager) => (
                                            <SelectItem key={manager.id} value={String(manager.id)}>
                                                {manager.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select
                                    value={formFilters.department_id || 'all'}
                                    onValueChange={(value) => setFormFilters({ ...formFilters, department_id: value === 'all' ? '' : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem key={department.id} value={String(department.id)}>
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Start Date From</Label>
                                <Input
                                    type="date"
                                    value={formFilters.start_date_from}
                                    onChange={(e) => setFormFilters({ ...formFilters, start_date_from: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>End Date To</Label>
                                <Input
                                    type="date"
                                    value={formFilters.end_date_to}
                                    onChange={(e) => setFormFilters({ ...formFilters, end_date_to: e.target.value })}
                                />
                            </div>

                            <div className="flex items-end gap-2">
                                <Button type="submit">Apply</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Project List ({projects.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-2 py-3">Project</th>
                                        <th className="px-2 py-3">Status</th>
                                        <th className="px-2 py-3">Priority</th>
                                        <th className="px-2 py-3">Manager</th>
                                        <th className="px-2 py-3">Progress</th>
                                        <th className="px-2 py-3">Tasks</th>
                                        <th className="px-2 py-3">Milestones</th>
                                        <th className="px-2 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.data.map((project) => (
                                        <tr key={project.id} className="border-b last:border-b-0">
                                            <td className="px-2 py-3">
                                                <div className="font-medium">{project.name}</div>
                                                <div className="text-xs text-muted-foreground">{project.code || 'No code'}</div>
                                            </td>
                                            <td className="px-2 py-3">
                                                <Badge variant="outline">{statusOptions[project.status] ?? project.status}</Badge>
                                            </td>
                                            <td className="px-2 py-3">
                                                <Badge variant="secondary">{priorityOptions[project.priority] ?? project.priority}</Badge>
                                            </td>
                                            <td className="px-2 py-3">{project.manager?.name ?? 'Unassigned'}</td>
                                            <td className="px-2 py-3">{project.progress ?? 0}%</td>
                                            <td className="px-2 py-3">{project.tasks_count ?? 0}</td>
                                            <td className="px-2 py-3">{project.milestones_count ?? 0}</td>
                                            <td className="px-2 py-3">
                                                <div className="flex gap-2">
                                                    <Link href={`/admin/projects/${project.id}`}>
                                                        <Button size="icon" variant="outline">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {canUpdate && (
                                                        <Link href={`/admin/projects/${project.id}/edit`}>
                                                            <Button size="icon" variant="outline">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() => deleteProject(project.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {projects.data.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">No projects found.</p>
                        )}
                    </CardContent>
                </Card>

                {projects.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            disabled={projects.current_page === 1}
                            onClick={() => router.get('/admin/projects', { ...formFilters, page: projects.current_page - 1 }, { preserveState: true })}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {projects.current_page} of {projects.last_page}
                        </span>
                        <Button
                            variant="outline"
                            disabled={projects.current_page === projects.last_page}
                            onClick={() => router.get('/admin/projects', { ...formFilters, page: projects.current_page + 1 }, { preserveState: true })}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
