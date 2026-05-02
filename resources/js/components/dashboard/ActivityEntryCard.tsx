import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ActivityEntry {
    id: number;
    task_title: string;
    hours: number;
    minutes: number;
    created_at: string;
}

interface ActivityEntryCardProps {
    entry: ActivityEntry;
}

export default function ActivityEntryCard({ entry }: ActivityEntryCardProps) {
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{entry.task_title}</span>
                    <Badge variant="outline">
                        {entry.hours}h {entry.minutes}m
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {formatTime(entry.created_at)}
                </p>
            </CardContent>
        </Card>
    );
}
