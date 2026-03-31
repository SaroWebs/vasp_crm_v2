import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Building2,
    CheckSquare,
    Eye,
    Filter,
    Mail,
    Package,
    Pencil,
    Phone,
    Plus,
    RotateCcw,
    Search,
    Square,
    Ticket,
    Trash,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Clients',
        href: '/admin/clients',
    },
];

interface ClientsIndexProps {
    filters?: any;
    userPermissions?: string[];
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canRead?: boolean;
}

interface ClientData {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    code: string | null;
    address: string | null;
    status: string;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    product: { id: number; name: string } | null;
    organization_users: Array<{
        id: number;
        name: string;
        email: string;
        designation: string | null;
        phone: string | null;
        status: string;
    }>;
    tickets: Array<{
        id: number;
        ticket_number: string;
        title: string;
        status: string;
        priority: string;
        created_at: string;
    }>;
}

interface PaginatedClients {
    data: ClientData[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export default function ClientsIndex(props: ClientsIndexProps) {
    const {
        filters = {},
        canCreate = false,
        canEdit = false,
        canDelete = false,
        canRead = false,
    } = props;

    // State for clients data
    const [clients, setClients] = useState<ClientData[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
    });
    const [loading, setLoading] = useState(false);

    // State for search, filtering, and selection
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingClientId, setDeletingClientId] = useState<number | null>(
        null,
    );
    const [restoringClientId, setRestoringClientId] = useState<number | null>(
        null,
    );
    const [forceDeletingClientId, setForceDeletingClientId] = useState<
        number | null
    >(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Load clients from server
    const loadClients = (page = 1, search = '', status = 'all') => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        if (search) {
            params.append('search', search);
        }
        if (status !== 'all') {
            params.append('status', status);
        }

        axios
            .get(`/admin/clients?${params.toString()}`)
            .then((res) => {
                setClients(res.data.clients || []);
                setPagination(res.data.pagination || {
                    current_page: 1,
                    per_page: 10,
                    total: 0,
                    last_page: 1,
                });
                setCurrentPage(page);
            })
            .catch((err) => {
                console.error('Failed to load clients:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Load clients on mount
    useEffect(() => {
        loadClients(1, searchTerm, statusFilter);
    }, []);

    // Debounced search - reload clients when search term changes (after delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.search) {
                loadClients(1, searchTerm, statusFilter);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle status filter change
    const handleStatusFilterChange = useCallback((value: string) => {
        setStatusFilter(value);
        loadClients(1, searchTerm, value);
    }, [searchTerm]);

    // Use server-side paginated clients directly
    const paginatedClients = useMemo(() => {
        return clients;
    }, [clients]);

    // Calculate statistics from current page clients
    const stats = useMemo(() => {
        const displayedClients = clients;
        const active = displayedClients.filter(
            (c) => c.status === 'active',
        ).length;
        const inactive = displayedClients.filter(
            (c) => c.status === 'inactive',
        ).length;
        const archived = displayedClients.filter(
            (c) => !!c.deleted_at,
        ).length;
        const withOrganizationUsers = displayedClients.filter(
            (c) => c.organization_users?.length > 0,
        ).length;
        const withOpenTickets = displayedClients.filter((c) =>
            c.tickets?.some((t: any) => t.status === 'open'),
        ).length;

        return {
            total: pagination.total,
            active,
            inactive,
            archived,
            withOrganizationUsers,
            withOpenTickets,
        };
    }, [clients, pagination.total]);

    const getStatusBadge = (status: string, isArchived: boolean) => {
        if (isArchived) {
            return <Badge variant="outline">Archived</Badge>;
        }

        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            active: 'default',
            inactive: 'secondary',
        };

        return (
            <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
        );
    };

    const handleSelectAll = () => {
        if (selectedClients.length === paginatedClients.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(paginatedClients.map((client) => client.id));
        }
    };

    const handleSelectClient = (clientId: number) => {
        setSelectedClients((prev) =>
            prev.includes(clientId)
                ? prev.filter((id) => id !== clientId)
                : [...prev, clientId],
        );
    };

    const handleDeleteClient = (clientId: number) => {
        if (!confirm('Are you sure you want to delete this client?')) {
            return;
        }

        setDeletingClientId(clientId);
        axios
            .delete(`/admin/clients/${clientId}`)
            .then(() => {
                setSelectedClients((prev) =>
                    prev.filter((id) => id !== clientId),
                );
                router.reload({ preserveUrl: true });
            })
            .finally(() => setDeletingClientId(null));
    };

    const handleRestoreClient = (clientId: number) => {
        if (!confirm('Restore this archived client?')) {
            return;
        }

        setRestoringClientId(clientId);
        axios
            .post(`/admin/clients/${clientId}/restore`)
            .then(() => {
                setSelectedClients((prev) =>
                    prev.filter((id) => id !== clientId),
                );
                router.reload({ preserveUrl: true });
            })
            .finally(() => setRestoringClientId(null));
    };

    const handleForceDeleteClient = (clientId: number) => {
        const confirmed = confirm(
            'Permanently delete this archived client? This action cannot be undone.',
        );
        if (!confirmed) {
            return;
        }

        setForceDeletingClientId(clientId);
        axios
            .delete(`/admin/clients/${clientId}/force-delete`)
            .then(() => {
                setSelectedClients((prev) =>
                    prev.filter((id) => id !== clientId),
                );
                router.reload({ preserveUrl: true });
            })
            .finally(() => setForceDeletingClientId(null));
    };

    const handleBulkAction = async (
        action: 'activate' | 'deactivate' | 'delete',
    ) => {
        if (action !== 'delete') {
            return;
        }

        if (selectedClients.length === 0) {
            return;
        }

        if (
            !confirm(
                `Are you sure you want to delete ${selectedClients.length} selected client(s)?`,
            )
        ) {
            return;
        }

        setIsBulkDeleting(true);
        const clientIds = clients
            .filter(
                (client) =>
                    selectedClients.includes(client.id) && !client.deleted_at,
            )
            .map((client) => client.id);

        try {
            if (clientIds.length === 0) {
                return;
            }

            await Promise.all(
                clientIds.map((clientId) =>
                    axios.delete(`/admin/clients/${clientId}`),
                ),
            );
            setSelectedClients([]);
            router.reload({ preserveUrl: true });
        } finally {
            setIsBulkDeleting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Clients
                            </h1>
                            <p className="text-muted-foreground">
                                Manage clients and their users
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {canCreate && (
                                <Button asChild>
                                    <Link href="/admin/clients/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Client
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="flex items-center gap-4">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={handleStatusFilterChange}
                        >
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                                <SelectItem value="archived">
                                    Archived
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bulk Actions */}
                    {selectedClients.length > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <span className="text-sm text-blue-700">
                                {selectedClients.length} client
                                {selectedClients.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                                {canEdit && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleBulkAction('activate')
                                            }
                                        >
                                            Activate
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleBulkAction('deactivate')
                                            }
                                        >
                                            Deactivate
                                        </Button>
                                    </>
                                )}
                                {canDelete && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                            handleBulkAction('delete')
                                        }
                                        disabled={isBulkDeleting}
                                    >
                                        {isBulkDeleting
                                            ? 'Deleting...'
                                            : 'Delete'}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedClients([])}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Clients
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active} active, {stats.inactive}{' '}
                                inactive, {stats.archived} archived
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active Clients
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.active}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Currently active accounts
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.withOrganizationUsers}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active users
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Open Tickets
                            </CardTitle>
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.withOpenTickets}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Requiring attention
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Client List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    All Clients ({pagination.total})
                                </CardTitle>
                                <CardDescription>
                                    {searchTerm || statusFilter !== 'all'
                                        ? `Showing ${clients.length} of ${pagination.total} clients`
                                        : `Complete list of all clients`}
                                </CardDescription>
                            </div>
                            {paginatedClients.length > 0 && (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAll}
                                    >
                                        {selectedClients.length ===
                                            paginatedClients.length ? (
                                            <CheckSquare className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Square className="mr-2 h-4 w-4" />
                                        )}
                                        Select All
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {clients.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'No clients match your search criteria.'
                                        : 'No clients found.'}
                                </p>
                            ) : (
                                paginatedClients.map((client) => (
                                    <div
                                        key={client.id}
                                        className={`space-y-2 rounded-lg border p-4 ${client.deleted_at ? 'bg-muted/30 opacity-75' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0"
                                                    onClick={() =>
                                                        handleSelectClient(
                                                            client.id,
                                                        )
                                                    }
                                                >
                                                    {selectedClients.includes(
                                                        client.id,
                                                    ) ? (
                                                        <CheckSquare className="h-4 w-4 text-blue-600" />
                                                    ) : (
                                                        <Square className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="text-sm leading-none font-medium">
                                                            {client.name}
                                                        </p>
                                                        <div className="mx-2 rounded border bg-muted px-2 py-1">
                                                            {client.code ? (
                                                                <span className="text-sm text-muted-foreground">
                                                                    Code:{' '}
                                                                    {
                                                                        client.code
                                                                    }
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">
                                                                    Code: Not
                                                                    Assigned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center">
                                                            <Mail className="mr-1 h-3 w-3" />
                                                            {client.email ||
                                                                'No email'}
                                                        </div>
                                                        {client.phone && (
                                                            <div className="flex items-center">
                                                                <Phone className="mr-1 h-3 w-3" />
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {client.address ||
                                                            'No address provided'}
                                                    </p>
                                                    {client.product && (
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <Package className="mr-1 h-3 w-3" />
                                                            {
                                                                client.product
                                                                    .name
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    {canRead &&
                                                        (client.deleted_at ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/admin/clients/${client.id}`}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>
                                                        ))}
                                                    {canEdit &&
                                                        (client.deleted_at ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/admin/clients/${client.id}/edit`}
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                        ))}
                                                    {canEdit &&
                                                        (client.deleted_at ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled
                                                            >
                                                                <Users className="mr-2 h-4 w-4" />
                                                                Manage Client
                                                                Users
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/admin/clients/${client.id}/organization-users/manage`}
                                                                >
                                                                    <Users className="mr-2 h-4 w-4" />
                                                                    Manage
                                                                    Client Users
                                                                </Link>
                                                            </Button>
                                                        ))}
                                                    {canDelete &&
                                                        (client.deleted_at ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleRestoreClient(
                                                                            client.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        restoringClientId ===
                                                                        client.id ||
                                                                        forceDeletingClientId ===
                                                                        client.id ||
                                                                        isBulkDeleting
                                                                    }
                                                                >
                                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                                    {restoringClientId ===
                                                                        client.id
                                                                        ? 'Restoring...'
                                                                        : 'Restore'}
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleForceDeleteClient(
                                                                            client.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        forceDeletingClientId ===
                                                                        client.id ||
                                                                        restoringClientId ===
                                                                        client.id ||
                                                                        isBulkDeleting
                                                                    }
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    {forceDeletingClientId ===
                                                                        client.id
                                                                        ? 'Deleting...'
                                                                        : 'Force Delete'}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDeleteClient(
                                                                        client.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    deletingClientId ===
                                                                    client.id ||
                                                                    isBulkDeleting
                                                                }
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                {deletingClientId ===
                                                                    client.id
                                                                    ? 'Deleting...'
                                                                    : 'Delete'}
                                                            </Button>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            {getStatusBadge(
                                                client.status,
                                                !!client.deleted_at,
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {client.organization_users
                                                    ?.length || 0}{' '}
                                                client users
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {client.status == 'active' &&
                                                    !client.deleted_at ? (
                                                    <Link
                                                        href={`/admin/tickets?client_id=${client.id}`}
                                                    >
                                                        {client.tickets
                                                            ?.length || 0}{' '}
                                                        tickets
                                                    </Link>
                                                ) : (
                                                    <>
                                                        {client.tickets
                                                            ?.length || 0}{' '}
                                                        tickets
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t pt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing{' '}
                                    {(currentPage - 1) * pagination.per_page +
                                        1}{' '}
                                    to{' '}
                                    {Math.min(
                                        currentPage * pagination.per_page,
                                        pagination.total,
                                    )}{' '}
                                    of {pagination.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            loadClients(
                                                currentPage - 1,
                                                searchTerm,
                                                statusFilter,
                                            )
                                        }
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} of{' '}
                                        {pagination.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            loadClients(
                                                currentPage + 1,
                                                searchTerm,
                                                statusFilter,
                                            )
                                        }
                                        disabled={
                                            currentPage === pagination.last_page
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
