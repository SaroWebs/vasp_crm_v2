import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    description?: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    description,
    variant = 'default',
}: StatCardProps) {
    const variantClasses = {
        default: 'text-foreground',
        success: 'text-emerald-600',
        warning: 'text-amber-600',
        destructive: 'text-destructive',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', variantClasses[variant])} />
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </div>
                <div className="text-xl font-bold">{value}</div>
            </CardHeader>
            {description && (
                <CardContent>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            )}
        </Card>
    );
}
