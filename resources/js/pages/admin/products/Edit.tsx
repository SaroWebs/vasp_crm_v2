import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import {
    TextInput,
    Textarea,
    Select,
    Button,
    Text,
    Group,
    Stack,
} from '@mantine/core';

interface EditProductProps {
    product: {
        id: number;
        name: string;
        description: string;
        version: string;
        status: 'active' | 'inactive' | 'discontinued';
        metadata?: Record<string, any>;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin',     href: '/admin/dashboard' },
    { title: 'Products',  href: '/admin/products' },
    { title: 'Edit',      href: '#' },
];

const STATUS_COLORS: Record<string, string> = {
    active:       '#0F6E56',
    inactive:     '#854F0B',
    discontinued: '#A32D2D',
};

export default function EditProduct({ product }: EditProductProps) {
    const { data, setData, put, processing, errors } = useForm({
        name:        product.name,
        description: product.description || '',
        version:     product.version || '',
        status:      product.status,
        metadata:    product.metadata || {},
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/products/${product.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${product.name}`} />

            <div className="flex h-full flex-1 flex-col">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4 border-b bg-background px-6 py-5">
                    <div>
                        <Text size="xs" fw={500} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.12em' }}>
                            Admin · Products
                        </Text>
                        <Text size="lg" fw={600} lh="xs">
                            Edit product
                        </Text>
                        <Text size="sm" c="dimmed" mt={2}>
                            {product.name}
                        </Text>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        leftSection={<ArrowLeft size={14} />}
                        component={Link}
                        href="/admin/products"
                    >
                        Back to products
                    </Button>
                </div>

                {/* ── Form ── */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-xl">
                        <form onSubmit={handleSubmit}>
                            <Stack gap="md">

                                <TextInput
                                    label="Product name"
                                    placeholder="e.g. Inventory Pro"
                                    required
                                    size="sm"
                                    value={data.name}
                                    onChange={e => setData('name', e.currentTarget.value)}
                                    error={errors.name}
                                />

                                <Textarea
                                    label="Description"
                                    placeholder="What does this product do?"
                                    size="sm"
                                    rows={4}
                                    value={data.description}
                                    onChange={e => setData('description', e.currentTarget.value)}
                                    error={errors.description}
                                />

                                <TextInput
                                    label="Version"
                                    placeholder="e.g. 2.1.0"
                                    size="sm"
                                    value={data.version}
                                    onChange={e => setData('version', e.currentTarget.value)}
                                    error={errors.version}
                                />

                                <Select
                                    label="Status"
                                    required
                                    size="sm"
                                    value={data.status}
                                    onChange={val =>
                                        setData('status', val as 'active' | 'inactive' | 'discontinued')
                                    }
                                    error={errors.status}
                                    data={[
                                        { value: 'active',       label: 'Active' },
                                        { value: 'inactive',     label: 'Inactive' },
                                        { value: 'discontinued', label: 'Discontinued' },
                                    ]}
                                    renderOption={({ option }) => (
                                        <Group gap="xs">
                                            <div
                                                style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: '50%',
                                                    background: STATUS_COLORS[option.value],
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Text size="sm">{option.label}</Text>
                                        </Group>
                                    )}
                                />

                                <div className="border-t pt-4">
                                    <Group justify="flex-end" gap="xs">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            component={Link}
                                            href="/admin/products"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            loading={processing}
                                        >
                                            Update product
                                        </Button>
                                    </Group>
                                </div>

                            </Stack>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}