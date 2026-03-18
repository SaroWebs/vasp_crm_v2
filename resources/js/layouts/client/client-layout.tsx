import ClientLayoutBase from '@/layouts/client-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function ClientLayout({
    children,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { auth } = usePage<SharedData>().props;

    const organizationUser: any = auth?.user;
    const client = organizationUser?.client;

    if (!client?.code) {
        return <>{children}</>;
    }

    return (
        <ClientLayoutBase
            client={{ name: client.name, code: client.code }}
        >
            {children}
        </ClientLayoutBase>
    );
}
