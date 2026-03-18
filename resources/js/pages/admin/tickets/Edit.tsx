import { Button } from '@/components/ui/button';
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
import { Ticket, type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Client {
    id: number;
    name: string;
    organizationUsers?: OrganizationUser[];
}

interface OrganizationUser {
    id: number;
    name: string;
    designation?: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface TicketsEditProps {
    ticket: Ticket & {
        client?: {
            id: number;
            name: string;
        };
        assignedTo?: User;
        approvedBy?: User;
    };
    clients: Client[];
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Tickets',
        href: '/admin/tickets',
    },
    {
        title: 'Edit Ticket',
        href: '#',
    },
];

export default function TicketsEdit({ ticket, clients, users }: TicketsEditProps) {
    const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
    const [loadingOrganizationUsers, setLoadingOrganizationUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        client_id: ticket.client_id?.toString() || '',
        organization_user_id: ticket.organization_user_id?.toString() || '',
        ticket_number: ticket.ticket_number || '',
        title: ticket.title || '',
        description: ticket.description || '',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        assigned_to: ticket.assigned_to?.toString() || '',
        approved_by: ticket.approved_by?.toString() || '',
    });

    // Load organization users when client_id changes
    useEffect(() => {
        const loadOrganizationUsers = async () => {
            if (form.client_id) {
                setLoadingOrganizationUsers(true);
                try {
                    const response = await axios.get(
                        `/admin/clients/${form.client_id}/organization-users`,
                    );
                    setOrganizationUsers(response.data.organization_users || []);
                } catch (error) {
                    console.error('Failed to fetch organization users', error);
                    toast.error('Failed to load organization users');
                } finally {
                    setLoadingOrganizationUsers(false);
                }
            } else {
                setOrganizationUsers([]);
            }
        };

        loadOrganizationUsers();
    }, [form.client_id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        if (name === 'client_id') {
            setForm((prev) => ({
                ...prev,
                client_id: value,
                organization_user_id: '',
            }));
            setOrganizationUsers([]);
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            router.patch(`/admin/tickets/${ticket.id}`, form, {
                onSuccess: () => {
                    toast.success('Ticket updated successfully');
                },
                onError: (errors) => {
                    console.error('Update failed', errors);
                    toast.error('Failed to update ticket');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        } catch (error) {
            console.error('Submit error', error);
            toast.error('Failed to update ticket');
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Ticket" />
            
            <div className="py-6 px-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                        >
                            <a href={`/admin/tickets/${ticket.id}`}>
                                <ArrowLeft className="h-5 w-5" />
                            </a>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Edit Ticket</h1>
                            <p className="text-muted-foreground">
                                Ticket #{ticket.ticket_number}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="text-lg font-semibold">Basic Information</h3>
                            <p className="text-sm text-muted-foreground">
                                Update the basic details of the ticket
                            </p>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            {/* Ticket Number - Read Only */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ticket_number">Ticket Number</Label>
                                    <Input
                                        id="ticket_number"
                                        name="ticket_number"
                                        value={form.ticket_number}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Ticket number cannot be changed
                                    </p>
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        name="priority"
                                        value={form.priority}
                                        onValueChange={(value) =>
                                            handleSelectChange('priority', value)
                                        }
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Enter ticket title"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Enter ticket description"
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Client & Organization User Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="text-lg font-semibold">Client & Organization User</h3>
                            <p className="text-sm text-muted-foreground">
                                Select the client and organization user
                            </p>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            {/* Client */}
                            <div className="space-y-2">
                                <Label htmlFor="client_id">Client</Label>
                                <Select
                                    name="client_id"
                                    value={form.client_id}
                                    onValueChange={(value) =>
                                        handleSelectChange('client_id', value)
                                    }
                                >
                                    <SelectTrigger id="client_id">
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem
                                                key={client.id}
                                                value={client.id.toString()}
                                            >
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Organization User */}
                            <div className="space-y-2">
                                <Label htmlFor="organization_user_id">
                                    Organization User
                                </Label>
                                <Select
                                    name="organization_user_id"
                                    value={form.organization_user_id}
                                    onValueChange={(value) =>
                                        handleSelectChange(
                                            'organization_user_id',
                                            value,
                                        )
                                    }
                                    disabled={!form.client_id || loadingOrganizationUsers}
                                >
                                    <SelectTrigger id="organization_user_id">
                                        <SelectValue
                                            placeholder={
                                                !form.client_id
                                                    ? 'Select client first'
                                                    : loadingOrganizationUsers
                                                    ? 'Loading...'
                                                    : 'Select organization user'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizationUsers.map((orgUser) => (
                                            <SelectItem
                                                key={orgUser.id}
                                                value={orgUser.id.toString()}
                                            >
                                                {orgUser.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="text-lg font-semibold">Assignment</h3>
                            <p className="text-sm text-muted-foreground">
                                Assign users to this ticket
                            </p>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Assigned To */}
                                <div className="space-y-2">
                                    <Label htmlFor="assigned_to">Assigned To</Label>
                                    <Select
                                        name="assigned_to"
                                        value={form.assigned_to || 'none'}
                                        onValueChange={(value) =>
                                            handleSelectChange(
                                                'assigned_to',
                                                value === 'none' ? '' : value,
                                            )
                                        }
                                    >
                                        <SelectTrigger id="assigned_to">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Unassigned</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id.toString()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {user.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        name="status"
                                        value={form.status}
                                        onValueChange={(value) =>
                                            handleSelectChange('status', value)
                                        }
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="in-progress">
                                                In Progress
                                            </SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                            <SelectItem value="cancelled">
                                                Cancelled
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Approved By - Only show for approved tickets */}
                            {(form.status === 'approved' ||
                                form.status === 'in-progress' ||
                                form.status === 'closed') && (
                                <div className="space-y-2">
                                    <Label htmlFor="approved_by">Approved By</Label>
                                    <Select
                                        name="approved_by"
                                        value={form.approved_by || 'none'}
                                        onValueChange={(value) =>
                                            handleSelectChange(
                                                'approved_by',
                                                value === 'none' ? '' : value,
                                            )
                                        }
                                    >
                                        <SelectTrigger id="approved_by">
                                            <SelectValue placeholder="Select approver" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not Approved</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id.toString()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {user.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <a href={`/admin/tickets/${ticket.id}`}>Cancel</a>
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
