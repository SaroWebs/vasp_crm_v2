import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ArrowLeft,
    Building2,
    CheckCircle,
    Eye,
    Key,
    Mail,
    MapPin,
    Phone,
    Save,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Clients', href: '/admin/clients' },
    { title: 'Edit Client', href: '' },
];

interface ClientEditProps {
    client: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        code?: string;
        address?: string;
        status: string;
        sso_enabled: boolean;
        has_sso_secret: boolean;
        created_at: string;
        updated_at: string;
    };
}

export default function ClientEdit({ client }: ClientEditProps) {
    const { data, setData, patch, processing, errors, recentlySuccessful } =
        useForm({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            code: client.code || '',
            address: client.address || '',
            status: client.status || 'active',
            sso_enabled: Boolean(client.sso_enabled),
            sso_secret: '',
        });

    const generateSsoSecret = () => {
        if (!window.crypto?.getRandomValues) {
            alert('Secure random generator is not available in this browser.');
            return;
        }

        const bytes = new Uint8Array(32);
        window.crypto.getRandomValues(bytes);

        let binary = '';
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }

        setData('sso_secret', btoa(binary));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/clients/${client.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Client: ${client.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Client
                        </h1>
                        <p className="text-muted-foreground">
                            Update client details and status
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/clients">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Clients
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/admin/clients/${client.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </Button>
                    </div>
                </div>

                {recentlySuccessful ? (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            Client updated successfully!
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Client Information</CardTitle>
                                <CardDescription>
                                    Update the client contact details, status,
                                    and SSO settings.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">
                                                Client Name *
                                            </Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    placeholder="Enter client name"
                                                    value={data.name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                            {errors.name ? (
                                                <p className="text-sm text-red-600">
                                                    {errors.name}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">
                                                Email Address
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter email address"
                                                    value={data.email}
                                                    onChange={(e) =>
                                                        setData(
                                                            'email',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="pl-10"
                                                />
                                            </div>
                                            {errors.email ? (
                                                <p className="text-sm text-red-600">
                                                    {errors.email}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">
                                                Phone Number
                                            </Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="Enter phone number"
                                                    value={data.phone}
                                                    onChange={(e) =>
                                                        setData(
                                                            'phone',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                            {errors.phone ? (
                                                <p className="text-sm text-red-600">
                                                    {errors.phone}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="code">
                                                Client Code
                                            </Label>
                                            <Input
                                                id="code"
                                                type="text"
                                                placeholder="Optional code (must be unique)"
                                                value={data.code}
                                                onChange={(e) =>
                                                    setData(
                                                        'code',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.code ? (
                                                <p className="text-sm text-red-600">
                                                    {errors.code}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">
                                                Status *
                                            </Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) =>
                                                    setData('status', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        Active
                                                    </SelectItem>
                                                    <SelectItem value="inactive">
                                                        Inactive
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status ? (
                                                <p className="text-sm text-red-600">
                                                    {errors.status}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Textarea
                                                id="address"
                                                placeholder="Enter complete address"
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                                className="min-h-[80px] pl-10"
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        {errors.address ? (
                                            <p className="text-sm text-red-600">
                                                {errors.address}
                                            </p>
                                        ) : null}
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Key className="mr-2 h-5 w-5" />
                                                Client SSO
                                            </CardTitle>
                                            <CardDescription>
                                                {client.has_sso_secret
                                                    ? 'SSO secret is already set. Leave blank to keep current secret.'
                                                    : 'SSO secret is not set yet.'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="sso_enabled"
                                                    checked={data.sso_enabled}
                                                    onCheckedChange={(checked) =>
                                                        setData(
                                                            'sso_enabled',
                                                            Boolean(checked),
                                                        )
                                                    }
                                                />
                                                <Label htmlFor="sso_enabled">
                                                    Enable SSO
                                                </Label>
                                            </div>

                                            {data.sso_enabled ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor="sso_secret">
                                                        SSO Secret
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="sso_secret"
                                                            type="text"
                                                            placeholder="Paste new base64 key (32 bytes) or generate"
                                                            value={data.sso_secret}
                                                            onChange={(e) =>
                                                                setData(
                                                                    'sso_secret',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={generateSsoSecret}
                                                        >
                                                            Generate
                                                        </Button>
                                                    </div>
                                                    {errors.sso_secret ? (
                                                        <p className="text-sm text-red-600">
                                                            {errors.sso_secret}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end space-x-2">
                                        <Button variant="outline" asChild>
                                            <Link
                                                href={`/admin/clients/${client.id}`}
                                            >
                                                Cancel
                                            </Link>
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing
                                                ? 'Updating...'
                                                : 'Update Client'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Client Details</CardTitle>
                                <CardDescription>
                                    Current client information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Client ID:
                                        </span>
                                        <span className="font-medium">
                                            #{client.id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Created:
                                        </span>
                                        <span className="font-medium">
                                            {new Date(
                                                client.created_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Last Updated:
                                        </span>
                                        <span className="font-medium">
                                            {new Date(
                                                client.updated_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link
                                        href={`/admin/clients/${client.id}/organization-users/manage`}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Manage Client Users
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link
                                        href={`/admin/tickets?client_id=${client.id}`}
                                    >
                                        View Tickets
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link href={`/admin/clients/${client.id}`}>
                                        Full Details
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}