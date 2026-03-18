import { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Role {
    id: number;
    name: string;
    slug: string;
    level: number;
}

interface MenuItem {
    key: string;
    title: string;
}

interface MenuGroup {
    title: string;
    items: MenuItem[];
}

interface Props {
    roles: Role[];
    menuGroups: MenuGroup[];
    assignments: Record<string, string[]>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Menu',
        href: '/admin/menu',
    },
];

export default function MenuManagementIndex({ roles, menuGroups, assignments }: Props) {
    const [localAssignments, setLocalAssignments] = useState<Record<string, string[]>>(assignments);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        setLocalAssignments(assignments);
    }, [assignments]);

    const allMenuKeys = useMemo(
        () => menuGroups.flatMap((group) => group.items.map((item) => item.key)),
        [menuGroups],
    );

    const roleSelectedCount = (roleId: number): number => {
        return (localAssignments[String(roleId)] || []).length;
    };

    const isChecked = (roleId: number, menuKey: string): boolean => {
        return (localAssignments[String(roleId)] || []).includes(menuKey);
    };

    const toggleMenuItem = (roleId: number, menuKey: string, checked: boolean): void => {
        const roleKey = String(roleId);
        setLocalAssignments((previous) => {
            const nextValues = new Set(previous[roleKey] || []);
            if (checked) {
                nextValues.add(menuKey);
            } else {
                nextValues.delete(menuKey);
            }

            return {
                ...previous,
                [roleKey]: Array.from(nextValues),
            };
        });
    };

    const allowAllForRole = (roleId: number): void => {
        setLocalAssignments((previous) => ({
            ...previous,
            [String(roleId)]: [...allMenuKeys],
        }));
    };

    const clearAllForRole = (roleId: number): void => {
        setLocalAssignments((previous) => ({
            ...previous,
            [String(roleId)]: [],
        }));
    };

    const saveAssignments = (): void => {
        setSaveMessage(null);
        setIsSaving(true);

        router.put(
            '/admin/menu',
            { assignments: localAssignments },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaveMessage('Menu access saved.');
                },
                onError: () => {
                    setSaveMessage('Unable to save menu access. Please retry.');
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Menu Access" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Menu Access</h1>
                        <p className="text-muted-foreground">
                            Select which sidebar items are visible for non-admin roles.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {saveMessage && (
                            <span className="text-sm text-muted-foreground">{saveMessage}</span>
                        )}
                        <Button onClick={saveAssignments} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Menu Access'}
                        </Button>
                    </div>
                </div>

                {roles.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Roles Available</CardTitle>
                            <CardDescription>
                                There are no non-admin roles to configure.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {roles.map((role) => (
                            <Card key={role.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <CardTitle>{role.name}</CardTitle>
                                            <CardDescription>{role.slug}</CardDescription>
                                        </div>
                                        <Badge variant="secondary">
                                            {roleSelectedCount(role.id)} / {allMenuKeys.length}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => allowAllForRole(role.id)}
                                        >
                                            Allow All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => clearAllForRole(role.id)}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    {menuGroups.map((group) => (
                                        <div key={`${role.id}-${group.title}`} className="space-y-3">
                                            <h3 className="text-sm font-semibold text-muted-foreground">
                                                {group.title}
                                            </h3>
                                            <div className="grid gap-2">
                                                {group.items.map((item) => {
                                                    const inputId = `role-${role.id}-${item.key}`;
                                                    return (
                                                        <div key={inputId} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={inputId}
                                                                checked={isChecked(role.id, item.key)}
                                                                onCheckedChange={(checked) =>
                                                                    toggleMenuItem(role.id, item.key, checked === true)
                                                                }
                                                            />
                                                            <Label htmlFor={inputId}>{item.title}</Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
