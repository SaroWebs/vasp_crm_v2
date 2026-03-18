import { CheckSquare, FileText, Milestone, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectShowData } from './types';
import { formatDate } from './utils';

interface ProjectOverviewTabProps {
    project: ProjectShowData;
    statusOptions: Record<string, string>;
    priorityOptions: Record<string, string>;
    milestoneCount: number;
    teamCount: number;
    attachmentCount: number;
    completedTasks: number;
    totalTasks: number;
}

export default function ProjectOverviewTab({
    project,
    statusOptions,
    priorityOptions,
    milestoneCount,
    teamCount,
    attachmentCount,
    completedTasks,
    totalTasks,
}: ProjectOverviewTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline">{statusOptions[project.status] ?? project.status}</Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary">{priorityOptions[project.priority] ?? project.priority}</Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{project.progress ?? 0}%</p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${project.progress ?? 0}%` }} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {project.budget ? `$${Number(project.budget).toLocaleString()}` : 'Not set'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Manager</span>
                            <span>{project.manager?.name ?? 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Department</span>
                            <span>{project.department?.name ?? 'Not linked'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Start Date</span>
                            <span>{formatDate(project.start_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">End Date</span>
                            <span>{formatDate(project.end_date)}</span>
                        </div>
                        {project.description && (
                            <div className="pt-2">
                                <p className="text-muted-foreground">Description</p>
                                <p className="mt-1">{project.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <CheckSquare className="h-4 w-4" />
                                Tasks
                            </span>
                            <span>
                                {completedTasks}/{totalTasks} completed
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Milestone className="h-4 w-4" />
                                Milestones
                            </span>
                            <span>{milestoneCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                Team Members
                            </span>
                            <span>{teamCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                Files
                            </span>
                            <span>{attachmentCount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
