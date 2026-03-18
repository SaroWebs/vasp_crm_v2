import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectOverviewTab from '@/components/projects/ProjectOverviewTab';
import ProjectPlanningTab from '@/components/projects/ProjectPlanningTab';
import ProjectTasksTab from '@/components/projects/ProjectTasksTab';
import ProjectMilestonesTab from '@/components/projects/ProjectMilestonesTab';
import ProjectTimelineTab from '@/components/projects/ProjectTimelineTab';
import ProjectFilesTab from '@/components/projects/ProjectFilesTab';
import ProjectSettingsTab from '@/components/projects/ProjectSettingsTab';
import {
    ProjectAttachment,
    ProjectMilestone,
    ProjectPhase,
    ProjectShowData,
    ProjectTeamMember,
    ProjectTimelineEvent,
    ProjectTask,
    TeamRole,
    UserOption,
} from '@/components/projects/types';

interface ProjectShowProps {
    project: ProjectShowData;
    statusOptions: Record<string, string>;
    priorityOptions: Record<string, string>;
    roleOptions: Record<TeamRole, string>;
    users: UserOption[];
    userPermissions?: string[];
}

export default function ShowProject({
    project,
    statusOptions,
    priorityOptions,
    roleOptions,
    users,
    userPermissions = [],
}: ProjectShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Projects', href: '/admin/projects' },
        { title: project.name, href: `/admin/projects/${project.id}` },
    ];

    const [activeMessage, setActiveMessage] = useState<string | null>(null);
    const [activeError, setActiveError] = useState<string | null>(null);

    const [phases, setPhases] = useState<ProjectPhase[]>(project.phases ?? []);
    const [milestones, setMilestones] = useState<ProjectMilestone[]>(project.milestones ?? []);
    const [timelineEvents, setTimelineEvents] = useState<ProjectTimelineEvent[]>(project.timeline_events ?? []);
    const [attachments, setAttachments] = useState<ProjectAttachment[]>(project.attachments ?? []);
    const [team, setTeam] = useState<ProjectTeamMember[]>(project.team ?? []);
    const [tasks, setTasks] = useState<ProjectTask[]>(project.tasks ?? []);

    const canEdit = userPermissions.includes('project.update');
    const canDelete = userPermissions.includes('project.delete');
    const canManagePhases = userPermissions.includes('project.manage_phases');
    const canManageMilestones = userPermissions.includes('project.manage_milestones');
    const canManageTimeline = userPermissions.includes('project.manage_timeline');
    const canManageAttachments = userPermissions.includes('project.manage_attachments');
    const canManageTeam = userPermissions.includes('project.manage_team');
    const canCreateTask = userPermissions.includes('task.create');

    const completedTasks = project.completed_tasks_count ?? tasks.filter((task) => task.state === 'Done').length;
    const totalTasks = project.tasks_count ?? tasks.length;

    const onActionSuccess = (message: string) => {
        setActiveMessage(message);
        setActiveError(null);
    };

    const onActionError = (error: unknown, fallback: string) => {
        const axiosMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
        setActiveError(axiosMessage);
        setActiveMessage(null);
    };

    const refreshPhases = async () => {
        const response = await axios.get(`/admin/projects/${project.id}/phases`);
        setPhases(response.data ?? []);
    };

    const refreshMilestones = async () => {
        const response = await axios.get(`/admin/projects/${project.id}/milestones`);
        setMilestones(response.data ?? []);
    };

    const refreshTimeline = async () => {
        const response = await axios.get(`/admin/projects/${project.id}/timeline`);
        setTimelineEvents(response.data ?? []);
    };

    const refreshAttachments = async () => {
        const response = await axios.get(`/admin/projects/${project.id}/attachments`);
        setAttachments(response.data ?? []);
    };

    const refreshTeam = async () => {
        const response = await axios.get(`/admin/projects/${project.id}/team`);
        setTeam(response.data ?? []);
    };

    const refreshTasks = async () => {
        const response = await axios.get(`/admin/projects/${project.id}/gantt`);
        setTasks(response.data?.tasks ?? []);
    };

    useEffect(() => {
        const run = async () => {
            try {
                await Promise.all([refreshPhases(), refreshMilestones(), refreshTimeline(), refreshAttachments(), refreshTeam(), refreshTasks()]);
            } catch (error) {
                onActionError(error, 'Unable to refresh project tabs.');
            }
        };
        void run();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/projects">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                            <p className="text-muted-foreground">{project.code || 'No project code'}</p>
                        </div>
                    </div>

                    {canEdit && (
                        <Link href={`/admin/projects/${project.id}/edit`}>
                            <Button>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Project
                            </Button>
                        </Link>
                    )}
                </div>

                {activeMessage && <div className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{activeMessage}</div>}
                {activeError && <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{activeError}</div>}

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="planning">Planning</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="milestones">Milestones</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="files">Files</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <ProjectOverviewTab
                            project={project}
                            statusOptions={statusOptions}
                            priorityOptions={priorityOptions}
                            milestoneCount={milestones.length}
                            teamCount={team.length}
                            attachmentCount={attachments.length}
                            completedTasks={completedTasks}
                            totalTasks={totalTasks}
                        />
                    </TabsContent>

                    <TabsContent value="planning">
                        <ProjectPlanningTab
                            projectId={project.id}
                            phases={phases}
                            canManagePhases={canManagePhases}
                            onPhasesChange={setPhases}
                            onSuccess={onActionSuccess}
                            onError={onActionError}
                        />
                    </TabsContent>

                    <TabsContent value="tasks">
                        <ProjectTasksTab
                            projectId={project.id}
                            tasks={tasks}
                            phases={phases}
                            canCreateTask={canCreateTask}
                            onRefreshTasks={refreshTasks}
                            onSuccess={onActionSuccess}
                            onError={onActionError}
                        />
                    </TabsContent>

                    <TabsContent value="milestones">
                        <ProjectMilestonesTab
                            projectId={project.id}
                            milestones={milestones}
                            canManageMilestones={canManageMilestones}
                            onMilestonesChange={setMilestones}
                            onSuccess={onActionSuccess}
                            onError={onActionError}
                        />
                    </TabsContent>

                    <TabsContent value="timeline">
                        <ProjectTimelineTab
                            projectId={project.id}
                            phases={phases}
                            timelineEvents={timelineEvents}
                            canManageTimeline={canManageTimeline}
                            onTimelineChange={setTimelineEvents}
                            onSuccess={onActionSuccess}
                            onError={onActionError}
                        />
                    </TabsContent>

                    <TabsContent value="files">
                        <ProjectFilesTab
                            projectId={project.id}
                            attachments={attachments}
                            canManageAttachments={canManageAttachments}
                            onAttachmentsChange={setAttachments}
                            onSuccess={onActionSuccess}
                            onError={onActionError}
                        />
                    </TabsContent>

                    <TabsContent value="settings">
                        <ProjectSettingsTab
                            projectId={project.id}
                            projectName={project.name}
                            users={users}
                            roleOptions={roleOptions}
                            team={team}
                            canManageTeam={canManageTeam}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onTeamChange={setTeam}
                            onSuccess={onActionSuccess}
                            onError={onActionError}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
