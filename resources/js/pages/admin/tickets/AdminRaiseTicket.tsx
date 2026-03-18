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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { FileText, Plus, Save, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

interface Client {
    id: number;
    name: string;
}

interface OrganizationUser {
    id: number;
    name: string;
    designation?: string | null;
}

interface FormData {
    ticket_number: string;
    organization_user_id: number | '';
    title: string;
    description: string;
    priority: string;
    category: string;
    status: string;
    client_id: number | '';
}

interface AdminRaiseTicketProps {
    clients: Client[];
    ticket_number: string;
}

export default function AdminRaiseTicket({
    clients,
    ticket_number,
}: AdminRaiseTicketProps) {
    const [open, setOpen] = useState(false);
    const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
    const [loadingOrganizationUsers, setLoadingOrganizationUsers] = useState(false);

    const [form, setForm] = useState<FormData>({
        ticket_number: ticket_number,
        organization_user_id: '',
        title: '',
        description: '',
        priority: 'low',
        category: 'technical',
        status: 'open',
        client_id: '',
    });

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleClientChange = async (clientId: string) => {
        const id = parseInt(clientId);
        setForm((prev) => ({
            ...prev,
            client_id: id,
            organization_user_id: '',
        }));
        setOrganizationUsers([]);

        if (id) {
            setLoadingOrganizationUsers(true);
            try {
                const response = await axios.get(
                    `/admin/clients/${id}/organization-users`,
                );
                const users = response.data.organization_users ?? [];
                setOrganizationUsers(users);

                const ticketResponse = await axios.get(
                    `/admin/client/${id}/next-ticket-number`,
                );
                if (ticketResponse.data.ticket_number) {
                    setForm((prev) => ({
                        ...prev,
                        ticket_number: ticketResponse.data.ticket_number,
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoadingOrganizationUsers(false);
            }
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData();

        Object.entries(form).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });

        files.forEach((file) => {
            formData.append(`attachments[]`, file);
        });

        router.post('/admin/tickets', formData, {
            forceFormData: true,
            onSuccess: () => {
                setOpen(false);
                setForm({
                    ticket_number: ticket_number,
                    organization_user_id: '',
                    title: '',
                    description: '',
                    priority: 'low',
                    category: 'technical',
                    status: 'open',
                    client_id: '',
                });
                setFiles([]);
            },
        });
    };

    const handleClickUpload = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...selected]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles((prev) => [...prev, ...droppedFiles]);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Ticket
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>New Ticket</SheetTitle>
                    <SheetDescription>
                        Create a new support ticket. Select a client to begin.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="m-6 space-y-6">
                    {/* Client Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="client_id">Client *</Label>
                        <Select
                            value={
                                form.client_id ? form.client_id.toString() : ''
                            }
                            onValueChange={handleClientChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Client" />
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

                    {/* Organization User Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="organization_user_id">
                            On behalf of *
                        </Label>
                        <div className="relative">
                            <Select
                                value={
                                    form.organization_user_id
                                        ? form.organization_user_id.toString()
                                        : ''
                                }
                                onValueChange={(val) =>
                                    handleSelectChange(
                                        'organization_user_id',
                                        val,
                                    )
                                }
                                disabled={!form.client_id || loadingOrganizationUsers}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            loadingOrganizationUsers
                                                ? 'Loading organization users...'
                                                : 'Select Organization User'
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

                    <div className="grid grid-cols-2 gap-4">
                        {/* Ticket Number */}
                        <div className="space-y-2">
                            <Label htmlFor="ticket_number">Ticket Number</Label>
                            <Input
                                id="ticket_number"
                                name="ticket_number"
                                value={form.ticket_number || 'Auto-generated'}
                                readOnly
                                className="bg-muted"
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={form.status}
                                onValueChange={(val) =>
                                    handleSelectChange('status', val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="approved">
                                        Approved
                                    </SelectItem>
                                    <SelectItem value="in-progress">
                                        In Progress
                                    </SelectItem>
                                    <SelectItem value="closed">
                                        Closed
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            type="text"
                            name="title"
                            placeholder="Enter ticket title"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Describe your issue or request"
                            value={form.description}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    {/* Category and Priority */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={form.category}
                                onValueChange={(val) =>
                                    handleSelectChange('category', val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="technical">
                                        Technical
                                    </SelectItem>
                                    <SelectItem value="billing">
                                        Billing
                                    </SelectItem>
                                    <SelectItem value="general">
                                        General
                                    </SelectItem>
                                    <SelectItem value="support">
                                        Support
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority *</Label>
                            <Select
                                value={form.priority}
                                onValueChange={(val) =>
                                    handleSelectChange('priority', val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">
                                        Critical
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* File Attachments */}
                    <div className="space-y-2">
                        <Label>Attachments</Label>
                        <div
                            ref={dropRef}
                            onClick={handleClickUpload}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                            <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                            <p className="text-sm text-gray-600">
                                Click to upload or drag and drop files here
                            </p>
                        </div>

                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />

                        {files.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm font-medium">
                                    Selected files:
                                </p>
                                <ul className="space-y-1">
                                    {files.map((f, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center text-sm text-gray-600"
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            {f.name} (
                                            {(f.size / 1024).toFixed(1)} KB)
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Create Ticket
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
