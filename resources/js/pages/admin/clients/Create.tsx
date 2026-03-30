import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    Key,
    Mail,
    MapPin,
    Phone,
    Save,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Clients', href: '/admin/clients' },
];

interface ClientFormData {
    name: string;
    email: string;
    phone: string;
    code: string;
    address: string;
    status: string;
    product_id: string;
    sso_enabled: boolean;
    sso_secret: string;
}

interface ClientsCreateProps {
    products?: Array<{ id: number; name: string }>;
}

export default function ClientsCreate({ products = [] }: ClientsCreateProps) {
    const { data, setData, post, processing, errors, recentlySuccessful } =
        useForm<ClientFormData>({
            name: '',
            email: '',
            phone: '',
            code: '',
            address: '',
            status: 'active',
            product_id: '',
            sso_enabled: false,
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
        post('/admin/clients');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Client" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Client
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new client and basic contact details
                        </p>
                    </div>
                </div>

                {recentlySuccessful ? (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            Client created successfully!
                        </AlertDescription>
                    </Alert>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Building2 className="mr-2 h-5 w-5" />
                            Client Information
                        </CardTitle>
                        <CardDescription>
                            Provide the organization name and contact
                            information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Client Name *</Label>
                                    <div className="relative">
                                        <Building2 className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Enter client name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
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
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter email address"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
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
                                        Phone Number (optional)
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="Enter phone number"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData('phone', e.target.value)
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.phone ? (
                                        <p className="text-sm text-red-600">
                                            {errors.phone}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code">Client Code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="Optional code (must be unique)"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData('code', e.target.value)
                                        }
                                    />
                                    {errors.code ? (
                                        <p className="text-sm text-red-600">
                                            {errors.code}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
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

                                <div className="space-y-2">
                                    <Label htmlFor="product_id">Product</Label>
                                    <select
                                        id="product_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.product_id || ''}
                                        onChange={(e) =>
                                            setData(
                                                'product_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">No Product</option>
                                        {products.map((product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.product_id ? (
                                        <p className="text-sm text-red-600">
                                            {errors.product_id}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="address"
                                        placeholder="Enter complete address"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                        className="min-h-[80px] pl-10"
                                        rows={3}
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
                                        Enable SSO-by-link for this client and
                                        set the shared secret (base64 of 32
                                        bytes).
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
                                                SSO Secret *
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="sso_secret"
                                                    type="text"
                                                    placeholder="Base64 key (32 bytes)"
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

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Client'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
