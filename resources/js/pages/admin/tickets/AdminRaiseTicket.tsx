import { Button as MantineButton, Select } from '@mantine/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select as UiSelect,
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
import { FileText, Plus, Save, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Client {
    id: number;
    name: string;
}

interface FormData {
    client_id: number | '';
    title: string;
    description: string;
    priority: string;
}

interface AdminRaiseTicketProps {
    clients: Client[];
}

export default function AdminRaiseTicket({ clients }: AdminRaiseTicketProps) {
    const [open, setOpen] = useState(false);
    const [clientSearchValue, setClientSearchValue] = useState('');
    const [sheetPortalTarget, setSheetPortalTarget] =
        useState<HTMLDivElement | null>(null);

    const [form, setForm] = useState<FormData>({
        client_id: '',
        title: '',
        description: '',
        priority: 'low',
    });

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof FormData, value: string) => {
        setForm((prev) => {
            if (name === 'client_id') {
                return { ...prev, client_id: value ? Number(value) : '' };
            }

            return { ...prev, [name]: value };
        });
    };

    const resetForm = () => {
        setForm({ client_id: '', title: '', description: '', priority: 'low' });
        setFiles([]);
        setClientSearchValue('');
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('client_id', form.client_id.toString());
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('priority', form.priority);

        files.forEach((file) => {
            formData.append('attachments[]', file);
        });

        router.post('/admin/tickets', formData, {
            forceFormData: true,
            onSuccess: () => {
                setOpen(false);
                resetForm();
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
            // Reset input so same file can be re-selected if removed
            e.target.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) {
            setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    return (
        <Sheet open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <SheetTrigger asChild>
                <MantineButton size="xs" leftSection={<Plus size={14} />}>
                    New Ticket
                </MantineButton>
            </SheetTrigger>
            <SheetContent
                ref={setSheetPortalTarget}
                className="overflow-y-auto sm:max-w-xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <SheetHeader>
                    <SheetTitle>New Ticket</SheetTitle>
                    <SheetDescription>
                        Create a support ticket on behalf of a client.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="m-6 space-y-6">
                    {/* Client */}
                    <div className="space-y-2">
                        <Label htmlFor="client_id">Client *</Label>
                        <Select
                            id="client_id"
                            className="w-full"
                            placeholder="Select client"
                            searchable
                            clearable
                            nothingFoundMessage="No clients found"
                            defaultDropdownOpened={false}
                            searchValue={clientSearchValue}
                            onSearchChange={setClientSearchValue}
                            data={clients.map((client) => ({
                                value: client.id.toString(),
                                label: client.name,
                            }))}
                            value={
                                form.client_id === ''
                                    ? null
                                    : form.client_id.toString()
                            }
                            onChange={(val) =>
                                handleSelectChange('client_id', val ?? '')
                            }
                            comboboxProps={{
                                withinPortal: true,
                                portalProps: {
                                    target: sheetPortalTarget ?? undefined,
                                },
                            }}
                        />
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
                            placeholder="Describe the issue or request"
                            value={form.description}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <UiSelect
                            value={form.priority}
                            onValueChange={(val) =>
                                handleSelectChange('priority', val)
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
                        </UiSelect>
                    </div>

                    {/* Attachments */}
                    <div className="space-y-2">
                        <Label>Attachments</Label>
                        <div
                            ref={dropRef}
                            onClick={handleClickUpload}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
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
                            <ul className="mt-3 space-y-1">
                                {files.map((f, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm text-gray-600"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 shrink-0" />
                                            <span className="truncate max-w-[280px]">
                                                {f.name}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                ({(f.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(i);
                                            }}
                                            className="ml-2 text-gray-400 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <MantineButton
                            variant="default"
                            type="button"
                            onClick={() => { setOpen(false); resetForm(); }}
                        >
                            Cancel
                        </MantineButton>
                        <MantineButton
                            type="submit"
                            disabled={!form.client_id || !form.title}
                            leftSection={<Save size={14} />}
                        >
                            Create Ticket
                        </MantineButton>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
