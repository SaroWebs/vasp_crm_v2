import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
}

interface Props {
    permissions: Record<string, Permission[]>;
}

export default function Create({ permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        level: 1,
        permissions: [] as number[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/roles', {
            onSuccess: () => router.visit('/admin/roles-permissions'),
        });
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionId]);
        } else {
            setData('permissions', data.permissions.filter(id => id !== permissionId));
        }
    };

    return (
        <>
            <Head title="Create Role" />

            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        onClick={() => router.visit('/admin/roles-permissions')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Create Role</h2>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Role Information</CardTitle>
                        <CardDescription>
                            Create a new role and assign permissions to it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Admin, Manager, User"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        placeholder="e.g., admin, manager, user"
                                    />
                                    {errors.slug && (
                                        <p className="text-sm text-red-600">{errors.slug}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="level">Level</Label>
                                    <Input
                                        id="level"
                                        type="number"
                                        min="1"
                                        value={data.level}
                                        onChange={(e) => setData('level', parseInt(e.target.value))}
                                    />
                                    {errors.level && (
                                        <p className="text-sm text-red-600">{errors.level}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe the role's purpose..."
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Label>Permissions</Label>
                                {Object.entries(permissions).map(([module, modulePermissions]) => (
                                    <div key={module} className="space-y-2">
                                        <h4 className="font-medium capitalize text-sm">{module}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-4">
                                            {modulePermissions.map((permission) => (
                                                <div key={permission.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`permission-${permission.id}`}
                                                        checked={data.permissions.includes(permission.id)}
                                                        onCheckedChange={(checked) =>
                                                            handlePermissionChange(permission.id, checked as boolean)
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`permission-${permission.id}`}
                                                        className="text-sm"
                                                    >
                                                        {permission.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {errors.permissions && (
                                    <p className="text-sm text-red-600">{errors.permissions}</p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/admin/roles-permissions')}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Role
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}