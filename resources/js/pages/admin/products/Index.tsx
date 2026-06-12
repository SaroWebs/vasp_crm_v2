import AppLayout from '@/layouts/app-layout';
import { Product, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Search, Package } from 'lucide-react';
import ProductCard from '@/components/admin/products/ProductCard';
import { useState } from 'react';
import { TextInput, Button, Text, Group } from '@mantine/core';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Products', href: '/admin/products' },
];

interface ProductsIndexProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters?: any;
    userPermissions?: string[];
}

export default function ProductsIndex({
    products,
    filters = {},
    userPermissions = [],
}: ProductsIndexProps) {
    const [search, setSearch] = useState('');

    const visible = search
        ? products.data.filter(p =>
              p.name?.toLowerCase().includes(search.toLowerCase())
          )
        : products.data;

    const totalClients = products.data.reduce(
        (sum, p) => sum + (p.clients_count ?? 0),
        0
    );

    const STATS = [
        { label: 'Total products', value: products.total,                        sub: null },
        { label: 'Total clients',  value: totalClients,                          sub: 'on this page' },
        { label: 'Showing',        value: `${products.from}–${products.to}`,     sub: `of ${products.total}` },
        { label: 'Page',           value: products.current_page,                 sub: `of ${products.last_page}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4 border-b bg-background px-6 py-5">
                    <div>
                        <Text size="xs" fw={500} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.12em' }}>
                            Admin · Products
                        </Text>
                        <Text size="lg" fw={600} lh="xs">
                            Product directory
                        </Text>
                    </div>

                    <Group gap="xs">
                        <TextInput
                            placeholder="Search products…"
                            size="sm"
                            leftSection={<Search size={14} />}
                            value={search}
                            onChange={e => setSearch(e.currentTarget.value)}
                            style={{ width: 220 }}
                        />
                        {userPermissions.includes('product.create') && (
                            <Button
                                size="sm"
                                leftSection={<Plus size={14} />}
                                component={Link}
                                href="/admin/products/create"
                            >
                                New product
                            </Button>
                        )}
                    </Group>
                </div>

                <div className="flex-1 overflow-auto p-6">

                    {/* ── Stats ── */}
                    <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {STATS.map(stat => (
                            <div key={stat.label} className="rounded-lg bg-muted/50 px-4 py-3.5">
                                <Text size="xs" c="dimmed">{stat.label}</Text>
                                <Text size="xl" fw={600} mt={4} style={{ letterSpacing: '-0.01em' }}>
                                    {stat.value}
                                </Text>
                                {stat.sub && (
                                    <Text size="xs" c="dimmed" mt={2}>{stat.sub}</Text>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Section label ── */}
                    <Text size="xs" fw={500} tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: '0.1em' }}>
                        {search
                            ? `${visible.length} result${visible.length !== 1 ? 's' : ''}`
                            : `${products.from}–${products.to} of ${products.total} products`}
                    </Text>

                    {/* ── Grid ── */}
                    {visible.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                            <Package size={26} className="text-muted-foreground/30" />
                            <Text size="sm" c="dimmed">
                                {search ? `No products match "${search}".` : 'No products yet.'}
                            </Text>
                            {!search && userPermissions.includes('product.create') && (
                                <Button
                                    variant="outline"
                                    size="xs"
                                    leftSection={<Plus size={13} />}
                                    component={Link}
                                    href="/admin/products/create"
                                >
                                    Create first product
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {visible.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ── */}
                    {products.last_page > 1 && (
                        <Group justify="space-between" mt="lg">
                            <Text size="sm" c="dimmed">
                                Page {products.current_page} of {products.last_page}
                            </Text>
                            <Group gap="xs">
                                {products.current_page > 1 && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        component={Link}
                                        href={`/admin/products?${new URLSearchParams({
                                            ...filters,
                                            page: (products.current_page - 1).toString(),
                                        })}`}
                                    >
                                        Previous
                                    </Button>
                                )}
                                {products.current_page < products.last_page && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        component={Link}
                                        href={`/admin/products?${new URLSearchParams({
                                            ...filters,
                                            page: (products.current_page + 1).toString(),
                                        })}`}
                                    >
                                        Next
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}