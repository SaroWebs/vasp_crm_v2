import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import NotificationMenu from './notifications/NotificationMenu';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2 w-full">
                <SidebarTrigger className="-ml-1" />
                <div className="w-full flex justify-between items-center gap-2">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                    <NotificationMenu />
                </div>
            </div>
        </header>
    );
}
