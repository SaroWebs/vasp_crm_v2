import { SalesLeadEmptyState } from '@/components/sales-leads/SalesLeadEmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    salesLeadInterestLevels,
    salesLeadStatuses,
} from '@/types/sales-leads';
import { Head } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    Filter,
    MessageSquareText,
    Plus,
    Search,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'My Sales Leads',
        href: '/my/sales-leads',
    },
];

const personalStats = [
    {
        label: 'My Leads',
        description: 'Prospects assigned to you',
        icon: Building2,
    },
    {
        label: 'Positive',
        description: 'Interested responses',
        icon: MessageSquareText,
    },
    {
        label: 'Follow-ups',
        description: 'Next actions to complete',
        icon: CalendarClock,
    },
];

export default function MySalesLeadsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Sales Leads" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                                Sales Work
                            </p>
                            <Badge variant="outline">Phase 1 frontend</Badge>
                        </div>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            My Sales Leads
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Prepare personal lead generation and follow-up work
                            without mixing prospects into client records.
                        </p>
                    </div>

                    <Button disabled className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Lead
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {personalStats.map((stat) => (
                        <Card key={stat.label}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.label}
                                </CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">--</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <CardTitle>Personal Lead List</CardTitle>
                                <CardDescription>
                                    Your own prospects and follow-up queue will
                                    appear here after phase 2 routes are added.
                                </CardDescription>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="relative min-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        disabled
                                        className="pl-9"
                                        placeholder="Search my prospects..."
                                    />
                                </div>

                                <Select disabled value="all-statuses">
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-statuses">
                                            All statuses
                                        </SelectItem>
                                        {salesLeadStatuses.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {status.replace('_', ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select disabled value="all-interest-levels">
                                    <SelectTrigger className="w-full md:w-[190px]">
                                        <SelectValue placeholder="Interest" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-interest-levels">
                                            All interest levels
                                        </SelectItem>
                                        {salesLeadInterestLevels.map((level) => (
                                            <SelectItem
                                                key={level}
                                                value={level}
                                            >
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SalesLeadEmptyState
                            title="Your lead workspace is ready for phase 2"
                            description="Once backend support is added, this page will show the organizations you contacted, their contact people, response quality, next follow-up dates, and activity history."
                            actionLabel="New Lead"
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
