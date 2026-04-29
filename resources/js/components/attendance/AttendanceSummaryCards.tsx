import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Timer } from 'lucide-react';

interface AttendanceSummaryCardsProps {
    summary: {
        total_days?: number;
        present_days: number;
        absent_days: number;
        late_days: number;
        total_hours: number;
    };
}

export function AttendanceSummaryCards({ summary }: AttendanceSummaryCardsProps) {
    const stats = [
        {
            label: 'Present',
            value: summary.present_days,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            label: 'Absent',
            value: summary.absent_days,
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
        },
        {
            label: 'Late',
            value: summary.late_days,
            icon: Clock,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
        },
        {
            label: 'Total Hours',
            value: summary.total_hours.toFixed(1),
            icon: Timer,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-semibold">{stat.value}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
