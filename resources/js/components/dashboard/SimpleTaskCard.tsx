import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TaskItem {
    id: number;
    title: string;
    department?: string;
    due_date?: string | null;
    status?: string;
    priority?: string;
}

interface SimpleTaskCardProps {
    task: TaskItem;
    showPriority?: boolean;
}

export default function SimpleTaskCard({ task, showPriority = true }: SimpleTaskCardProps) {
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getPriorityVariant = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'critical':
            case 'p1':
                return 'destructive';
            case 'medium':
            case 'p2':
                return 'default';
            default:
                return 'secondary';
        }
    };

    return (
        <Link href={`/admin/tasks/${task.id}`}>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                                {task.department || 'No department'} • Due:{' '}
                                {formatDate(task.due_date)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline">{task.status || 'Unknown'}</Badge>
                            {showPriority && task.priority && (
                                <Badge variant={getPriorityVariant(task.priority)}>
                                    {task.priority}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
