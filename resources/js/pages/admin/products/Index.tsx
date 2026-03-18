import AppLayout from '@/layouts/app-layout';
import { Product, type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Search, ArrowUpDown } from 'lucide-react';
import ProductCard from '@/components/admin/products/ProductCard';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Products',
        href: '/admin/products',
    },
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

export default function ProductsIndex(props: ProductsIndexProps) {
    const {
        products,
        filters = {},
        userPermissions = []
    } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Products</p>
                        <h1 className="text-3xl font-bold">Product Management</h1>
                        <p className="text-muted-foreground mt-1">View product metrics, manage clients, and quickly take action.</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {userPermissions.includes('product.create') && (
                            <Link href="/admin/products/create">
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Product
                                </Button>
                            </Link>
                        )}
                        <Button variant="ghost" className="gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            Sort by Latest
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Total Products</CardTitle>
                            <CardDescription className="text-xs">All active products</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{products.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Showing</CardTitle>
                            <CardDescription className="text-xs">Current page items</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{products.data.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Page</CardTitle>
                            <CardDescription className="text-xs">{products.current_page} of {products.last_page}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{products.current_page}</div>
                        </CardContent>
                    </Card>
                    <Card className="border border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Clients</CardTitle>
                            <CardDescription className="text-xs">All clients in this page</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{products.data.reduce((sum, prod) => sum + (prod.clients_count ?? 0), 0)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border border-slate-200">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="text-base">Product Directory</CardTitle>
                            <CardDescription>Search, filter, and manage active products.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <input
                                className="w-full bg-transparent text-sm outline-none"
                                type="text"
                                placeholder="Search products..."
                                aria-label="Search products"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {products.data.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground">
                                No products found yet. Create your first product to begin tracking clients.
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {products.data.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {products.from} - {products.to} of {products.total} products
                    </div>
                    <div className="flex items-center gap-2">
                        {products.current_page > 1 && (
                            <Link
                                href={`/admin/products?${new URLSearchParams({ ...filters, page: (products.current_page - 1).toString() }).toString()}`}
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                            >
                                Previous
                            </Link>
                        )}
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm">Page {products.current_page}</span>
                        {products.current_page < products.last_page && (
                            <Link
                                href={`/admin/products?${new URLSearchParams({ ...filters, page: (products.current_page + 1).toString() }).toString()}`}
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
