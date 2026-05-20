import DailyAttendancePanel from "@/components/admin/employees/DailyAttendancePanel";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";

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
                Sample content goes here. This page is for testing and demonstration purposes.
            </div>
        </AppLayout>
    );
}