import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem, type NavGroup, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutGrid, 
    ShieldCheck,
    Building2,
    Ticket,
    CheckSquare,
    UserCheck,
    Package,
    Bell,
    UserCog,
    Users,
    BarChart3,
    Gauge,
    ListChecks,
} from 'lucide-react';
import AppLogo from './app-logo';

function hasRoleAccess(item: NavItem, userRoles: string[] | undefined): boolean {
    if (!item.roles || item.roles.length === 0) {
        return true;
    }
    if (!userRoles || userRoles.length === 0) {
        return false;
    }
    return item.roles.some(role => userRoles.includes(role));
}

function hasAccessToItem(
    item: NavItem,
    userRoles: string[] | undefined,
    menuAccess: Record<string, boolean>,
    menuAccessConfigured: boolean,
): boolean {
    const roleAccess = hasRoleAccess(item, userRoles);

    if (item.adminOnly) {
        return roleAccess;
    }

    if (menuAccessConfigured && item.menuKey && item.menuKey in menuAccess) {
        return Boolean(menuAccess[item.menuKey]);
    }

    return roleAccess;
}

function filterNavGroups(
    groups: NavGroup[],
    userRoles: string[] | undefined,
    menuAccess: Record<string, boolean>,
    menuAccessConfigured: boolean,
): NavGroup[] {
    return groups
        .map(group => ({
            ...group,
            items: group.items.filter(item =>
                hasAccessToItem(item, userRoles, menuAccess, menuAccessConfigured)
            )
        }))
        .filter(group => group.items.length > 0);
}

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
    },
];

const adminNavGroups: NavGroup[] = [
    {
        title: 'Organization',
        items: [
            {
                title: 'Departments',
                href: '/admin/departments',
                icon: Building2,
                roles: ['super-admin', 'admin', 'manager'],
                menuKey: 'organization.departments',
            },
            {
                title: 'Products',
                href: '/admin/products',
                icon: Package,
                roles: ['super-admin', 'admin', 'manager'],
                menuKey: 'organization.products',
            },
            {
                title: 'Projects',
                href: '/admin/projects',
                icon: CheckSquare,
                roles: ['super-admin', 'admin', 'manager', 'team-lead'],
                menuKey: 'organization.projects',
            },
            {
                title: 'Employees',
                href: '/admin/employees',
                icon: UserCheck,
                roles: ['super-admin', 'admin', 'manager'],
                menuKey: 'organization.employees',
            },
            {
                title: 'Clients',
                href: '/admin/clients',
                icon: Users,
                roles: ['super-admin', 'admin', 'manager'],
                menuKey: 'organization.clients',
            },
        ],
    },
    {
        title: 'Tasks',
        items: [
            {
                title: 'Tickets',
                href: '/admin/tickets',
                icon: Ticket,
                roles: ['super-admin', 'admin', 'support-agent', 'team-lead', 'manager'],
                menuKey: 'tasks.tickets',
            },
            {
                title: 'Tasks',
                href: '/admin/tasks',
                icon: CheckSquare,
                roles: ['super-admin', 'admin', 'manager', 'team-lead', 'developer', 'employee'],
                menuKey: 'tasks.tasks',
            },
            {
                title: 'Task Reports',
                href: '/admin/reports',
                icon: BarChart3,
                roles: ['super-admin', 'admin', 'manager', 'team-lead'],
                menuKey: 'tasks.task-reports',
            },
            {
                title: 'Workload Matrix',
                href: '/admin/workload-matrix',
                icon: Gauge,
                roles: ['super-admin', 'admin', 'manager', 'team-lead'],
                menuKey: 'tasks.workload-matrix',
            },
            {
                title: 'My Tasks',
                href: '/my/tasks',
                icon: UserCog,
                menuKey: 'tasks.my-tasks',
            },
        ],
    },
    {
        title: 'Security',
        items: [
            {
                title: 'Roles & Permissions',
                href: '/admin/roles',
                icon: ShieldCheck,
                roles: ['super-admin', 'admin'],
                menuKey: 'security.roles-permissions',
            },
        ],
    },
    {
        title: 'System',
        items: [
            {
                title: 'Notifications',
                href: '/admin/notifications',
                icon: Bell,
                menuKey: 'system.notifications',
            },
            {
                title: 'Menu',
                href: '/admin/menu',
                icon: ListChecks,
                roles: ['super-admin', 'admin'],
                menuKey: 'system.menu',
                adminOnly: true,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userRoles = auth?.user?.roles?.map((role: { slug: string }) => role.slug) || [];
    const isAdminUser = userRoles.includes('admin') || userRoles.includes('super-admin');
    const menuAccess = auth?.menu_access || {};
    const menuAccessConfigured = Boolean(auth?.menu_access_configured) && !isAdminUser;

    const filteredNavGroups = filterNavGroups(
        adminNavGroups,
        userRoles,
        menuAccess,
        menuAccessConfigured,
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain 
                    items={mainNavItems} 
                    groups={filteredNavGroups}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
