import TaskTimeline from "@/components/admin/TaskTimeline";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";

// TaskTimeline
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sample Page',
        href: '/sample',
    },
];
export default function SamplePage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sample Page" />
            <div className="p-4">
                <TaskTimeline/>
            </div>
        </AppLayout>
    );
}