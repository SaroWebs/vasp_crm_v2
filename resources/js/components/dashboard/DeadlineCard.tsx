import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface DeadlineItem {
    id: number;
    title: string;
    status?: string;
    due_date?: string | null;
    is_overdue?: boolean;
}

interface DeadlineCardProps {
    task: DeadlineItem;
}

export default function DeadlineCard({ task }: DeadlineCardProps) {
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Card className={task.is_overdue ? 'border-destructive/50' : ''}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{task.title}</span>
                    <Badge variant={task.is_overdue ? 'destructive' : 'secondary'}>
                        {task.status || 'Unknown'}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Due {formatDate(task.due_date)}
                    {task.is_overdue && (
                        <span className="text-destructive ml-1">(Overdue)</span>
                    )}
                </p>
            </CardContent>
        </Card>
    );
}
