import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value?: number | string;
    icon: LucideIcon;
    description?: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    description,
    variant = 'default',
}: StatCardProps) {
    const variantClasses = {
        default: 'text-foreground bg-primary/10',
        success: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
        warning: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
        destructive: 'text-destructive bg-destructive/10',
        info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    };

    const iconColorClasses = {
        default: 'text-primary',
        success: 'text-emerald-600',
        warning: 'text-amber-600',
        destructive: 'text-destructive',
        info: 'text-blue-600',
    };

    return (
        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-border/50 bg-gradient-to-br from-card to-card/95 overflow-hidden relative">
            {/* Subtle top border gradient based on variant */}
            <div className={cn("absolute top-0 left-0 right-0 h-1", 
                variant === 'default' ? 'bg-primary/20' : 
                variant === 'success' ? 'bg-emerald-500/30' : 
                variant === 'warning' ? 'bg-amber-500/30' : 
                variant === 'destructive' ? 'bg-destructive/30' : 'bg-blue-500/30'
            )} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    <div className="text-2xl font-bold tracking-tight">{value}</div>
                </div>
                <div className={cn("p-2.5 rounded-xl", variantClasses[variant])}>
                    <Icon className={cn('h-5 w-5', iconColorClasses[variant])} />
                </div>
            </CardHeader>
            {description && (
                <CardContent>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            )}
        </Card>
    );
}
