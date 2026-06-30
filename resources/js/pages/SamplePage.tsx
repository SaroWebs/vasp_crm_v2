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

            <div className="p-4">
                Testing goes here. This page is for testing and demonstration purposes.
            </div>
            <div className="p-4">
                {auth?.user ? (
                    <div>Welcome, {auth.user.name}</div>
                ) : null}
            </div>
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {dashboard_type === 'employee' ? (
                    <div>Employee Dashboard Content</div>
                ) : (
                    <div>Admin Dashboard Content</div>
                )}
            </div>
        </AppLayout>
    );
}