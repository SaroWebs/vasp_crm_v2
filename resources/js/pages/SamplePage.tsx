import AdminScreen from "@/components/dash/AdminScreen";
import EmployeeScreen from "@/components/dash/EmployeeScreen";
import AppLayout from "@/layouts/app-layout";
import { Auth, BreadcrumbItem } from "@/types";
import { Head, usePage } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sample Page',
        href: '/sample',
    },
];

interface SamplePageProps {
    dashboard_type?: 'admin' | 'manager' | 'employee';
    auth?: Auth;
}

export default function SamplePage(props: SamplePageProps) {
    const page = usePage<{ auth?: Auth }>();
    const {dashboard_type = 'employee',  auth = page.props.auth ?? null } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs} auth={auth ?? undefined}>
            <Head title="Sample Page" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {dashboard_type === 'employee' ? (
                    <EmployeeScreen auth={auth} />
                ) : (
                    <AdminScreen auth={auth} />
                )}
            </div>
        </AppLayout>
    );
}