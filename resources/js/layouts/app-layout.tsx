import { NotificationProvider } from '@/context/NotificationContext';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    auth?: {
        user?: {
            id?: number | string;
        };
    };
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {

    return (
        <NotificationProvider userId={props.auth?.user?.id}>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>
        </NotificationProvider>
    );
};
