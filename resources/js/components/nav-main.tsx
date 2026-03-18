import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem, type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [], groups = [] }: { 
    items?: NavItem[]; 
    groups?: NavGroup[];
}) {
    const page = usePage();

    const renderNavItem = (item: NavItem) => (
        <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
                asChild
                isActive={page.url.startsWith(resolveUrl(item.href))}
                tooltip={{ children: item.title }}
            >
                <Link href={item.href} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );

    return (
        <>
            {/* Single items */}
            {items.length > 0 && (
                <SidebarGroup className="px-2 py-0">
                    <SidebarMenu>
                        {items.map(renderNavItem)}
                    </SidebarMenu>
                </SidebarGroup>
            )}

            {/* Grouped items */}
            {groups.map((group) => (
                <SidebarGroup key={group.title} className="px-2 py-0">
                    <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.items.map(renderNavItem)}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
