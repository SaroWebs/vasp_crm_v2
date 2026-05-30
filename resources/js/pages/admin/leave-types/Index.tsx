import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';

interface LeaveType {
    id: number;
    name: string;
    description?: string;
    duration_type: 'full_day' | 'half_day' | 'custom_hours' | 'hourly';
    default_hours?: number | null;
    requires_approval: boolean;
    is_paid: boolean;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Leaves',
        href: '/admin/leave-types',
    },
];

export default function Index() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    async function fetchLeaveTypes() {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/leave-types');
            setLeaveTypes(data.leave_types || []);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Types" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leave Types</h1>
                        <p className="text-muted-foreground">Manage leave types and common allocations</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/employees">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Employees
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/admin/leave-types/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Leave Type
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading leave types...</p>
                    ) : leaveTypes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No leave types found.</p>
                    ) : (
                        leaveTypes.map((lt) => (
                            <div key={lt.id} className="rounded-lg border bg-card p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-semibold">{lt.name}</h3>
                                    <span className={`text-[10px] rounded-full px-2 py-0.5 ${lt.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                        {lt.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {lt.description && (
                                    <p className="text-xs text-muted-foreground">{lt.description}</p>
                                )}
                                <div className="flex gap-2 text-[10px]">
                                    <span className="rounded bg-muted px-1.5 py-0.5 capitalize">{lt.duration_type.replace('_', ' ')}</span>
                                    <span className={`rounded px-1.5 py-0.5 ${lt.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                                        {lt.is_paid ? 'Paid' : 'Unpaid'}
                                    </span>
                                    {lt.requires_approval && (
                                        <span className="rounded bg-amber-100 text-amber-700 px-1.5 py-0.5">Approval Required</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}