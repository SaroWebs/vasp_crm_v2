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
    type SalesLeadFilterPlaceholder,
    type SalesLeadPlaceholderMetric,
} from '@/types/sales-leads';
import { Head } from '@inertiajs/react';
import {
    BarChart3,
    CalendarClock,
    Filter,
    Handshake,
    ListChecks,
    Plus,
    Search,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Sales Leads',
        href: '/admin/sales-leads',
    },
];

const metrics: SalesLeadPlaceholderMetric[] = [
    {
        label: 'Total Leads',
        value: '--',
        description: 'Generated in the selected period',
    },
    {
        label: 'Positive Leads',
        value: '--',
        description: 'Prospects marked as positive',
    },
    {
        label: 'Follow-ups',
        value: '--',
        description: 'Upcoming or overdue follow-ups',
    },
    {
        label: 'Employee Activity',
        value: '--',
        description: 'Lead work grouped by sales employee',
    },
];

const filters: SalesLeadFilterPlaceholder[] = [
    { label: 'Employee', value: 'all-employees' },
    { label: 'Service', value: 'all-services' },
    { label: 'Date Range', value: 'current-month' },
];

const metricIcons = [ListChecks, Handshake, CalendarClock, Users];

export default function AdminSalesLeadsIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Leads" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                                Sales CRM
                            </p>
                        </div>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            Sales Leads
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Track prospects separately from clients, then connect
                            real lead data and follow-up history in phase 2.
                        </p>
                    </div>

                    <Button disabled className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Lead
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric, index) => {
                        const Icon = metricIcons[index] ?? BarChart3;

                        return (
                            <Card key={metric.label}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {metric.label}
                                    </CardTitle>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {metric.value}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {metric.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <CardTitle>Lead Directory</CardTitle>
                                <CardDescription>
                                    Filters are prepared for backend-powered lead
                                    tracking in phase 2.
                                </CardDescription>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="relative min-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        disabled
                                        className="pl-9"
                                        placeholder="Search prospects..."
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
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                            {filters.map((filter) => (
                                <div
                                    key={filter.label}
                                    className="rounded-lg border bg-muted/30 p-4"
                                >
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        {filter.label}
                                    </p>
                                    <p className="mt-1 text-sm font-medium">
                                        {filter.value.replace('-', ' ')}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <SalesLeadEmptyState
                            title="Lead tracking will be connected in phase 2"
                            description="This page is ready for all sales prospect records, admin filters, employee-wise counts, interest levels, and follow-up reporting. It does not use existing Clients data."
                            actionLabel="Backend pending"
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
