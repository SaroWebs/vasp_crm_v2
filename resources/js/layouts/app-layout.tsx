import { NotificationProvider } from '@/context/NotificationContext';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem, type Auth } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    auth?: Auth | null;
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const page = usePage<{ auth?: AppLayoutProps['auth'] }>();
    const userId = props.auth?.user?.id ?? page.props.auth?.user?.id;

    return (
        <NotificationProvider userId={userId}>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>
        </NotificationProvider>
    );
};
