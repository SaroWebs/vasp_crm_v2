import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, LucideIcon } from 'lucide-react';

interface SalesLeadEmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    icon?: LucideIcon;
}

export function SalesLeadEmptyState({
    title,
    description,
    actionLabel,
    icon: Icon = Building2,
}: SalesLeadEmptyStateProps) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                </div>
                {actionLabel ? (
                    <Button disabled variant="outline">
                        {actionLabel}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}
