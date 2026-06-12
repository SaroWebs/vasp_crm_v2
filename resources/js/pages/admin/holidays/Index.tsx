import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Plus, Copy, Trash2, CalendarDays, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    Alert,
    Badge,
    Dialog,
    Group,
    Loader,
    Modal,
    Select,
    Stack,
    Table,
    TextInput,
    Button as MantineButton,
    Text,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';

interface Holiday {
    id: number;
    date: string;
    name: string;
    type: 'national' | 'state' | 'restricted';
}

interface AddHolidayFormData {
    date: string;
    name: string;
    type: 'national' | 'state' | 'restricted';
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Holidays', href: '/admin/holidays' },
];

const TYPE_META: Record<string, { color: string; label: string; accent: string }> = {
    national: { color: 'blue',   label: 'National',   accent: '#3b82f6' },
    state:    { color: 'teal',   label: 'State',      accent: '#14b8a6' },
    restricted:{ color: 'orange', label: 'Restricted', accent: '#f97316' },
};

const YEARS = ['2024', '2025', '2026', '2027', '2028'];

export default function HolidaysIndex() {
    const [holidays, setHolidays]       = useState<Holiday[]>([]);
    const [loading, setLoading]         = useState(true);
    const [year, setYear]               = useState(new Date().getFullYear());
    const [typeFilter, setTypeFilter]   = useState<string | null>(null);
    const [search, setSearch]           = useState('');
    const [showAdd, setShowAdd]         = useState(false);
    const [showCopy, setShowCopy]       = useState(false);
    const [saving, setSaving]           = useState(false);
    const [deletingId, setDeletingId]   = useState<number | null>(null);
    const [message, setMessage]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<AddHolidayFormData>({
        date: '', name: '', type: 'national',
    });
    const [copyForm, setCopyForm] = useState({
        from_year: new Date().getFullYear(),
        to_year: new Date().getFullYear() + 1,
    });

    useEffect(() => { fetchHolidays(); }, [year, typeFilter]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    async function fetchHolidays() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ year: year.toString() });
            if (typeFilter) params.append('type', typeFilter);
            const { data } = await axios.get(`/api/holidays?${params}`);
            setHolidays(data.holidays || []);
        } catch {
            setHolidays([]);
        } finally {
            setLoading(false);
        }
    }

    const handleAddHoliday = async () => {
        if (!formData.date || !formData.name) {
            setMessage({ type: 'error', text: 'Date and name are required.' });
            return;
        }
        setSaving(true);
        try {
            await axios.post('/api/holidays', formData);
            setMessage({ type: 'success', text: 'Holiday added.' });
            setFormData({ date: '', name: '', type: 'national' });
            setShowAdd(false);
            fetchHolidays();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to add holiday.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHoliday = async (id: number) => {
        if (!window.confirm('Delete this holiday?')) return;
        setDeletingId(id);
        try {
            await axios.delete(`/api/holidays/d/${id}`);
            setMessage({ type: 'success', text: 'Holiday deleted.' });
            fetchHolidays();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to delete.' });
        } finally {
            setDeletingId(null);
        }
    };

    const handleCopyYear = async () => {
        setSaving(true);
        try {
            await axios.patch('/api/holidays/copy_year', copyForm);
            setMessage({ type: 'success', text: `Holidays copied to ${copyForm.to_year}.` });
            setShowCopy(false);
            setYear(copyForm.to_year);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to copy.' });
        } finally {
            setSaving(false);
        }
    };

    const visible = holidays
        .filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Holiday Management" />

            <div className="flex h-full flex-1 flex-col gap-0">

                {/* ── Page Header ── */}
                <div className="border-b bg-background px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                                <CalendarDays size={18} className="text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold leading-tight">Holiday Management</h1>
                                <p className="text-sm text-muted-foreground">
                                    {loading ? '…' : `${visible.length} holiday${visible.length !== 1 ? 's' : ''}`} · {year}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <MantineButton
                                variant="default"
                                size="sm"
                                leftSection={<Copy size={14} />}
                                onClick={() => setShowCopy(true)}
                            >
                                Copy year
                            </MantineButton>
                            <MantineButton
                                size="sm"
                                leftSection={<Plus size={14} />}
                                onClick={() => setShowAdd(true)}
                            >
                                Add holiday
                            </MantineButton>
                        </div>
                    </div>
                </div>

                {/* ── Flash message ── */}
                {message && (
                    <div className="px-6 pt-4">
                        <Alert
                            color={message.type === 'success' ? 'teal' : 'red'}
                            withCloseButton
                            onClose={() => setMessage(null)}
                            py="xs"
                        >
                            {message.text}
                        </Alert>
                    </div>
                )}

                {/* ── Toolbar ── */}
                <div className="flex items-end gap-3 px-6 py-4">
                    <div style={{ width: 100 }}>
                        <Select
                            label="Year"
                            size="sm"
                            value={year.toString()}
                            onChange={val => setYear(parseInt(val || '2026'))}
                            data={YEARS.map(y => ({ value: y, label: y }))}
                        />
                    </div>
                    <div style={{ width: 140 }}>
                        <Select
                            label="Type"
                            size="sm"
                            placeholder="All types"
                            clearable
                            value={typeFilter}
                            onChange={setTypeFilter}
                            data={[
                                { value: 'national',   label: 'National' },
                                { value: 'state',      label: 'State' },
                                { value: 'restricted', label: 'Restricted' },
                            ]}
                        />
                    </div>
                    <div className="flex-1">
                        <Text size="sm" fw={500} mb={4}>Search</Text>
                        <TextInput
                            size="sm"
                            placeholder="Filter by name…"
                            leftSection={<Search size={14} />}
                            value={search}
                            onChange={e => setSearch(e.currentTarget.value)}
                        />
                    </div>
                    <MantineButton
                        variant="subtle"
                        size="sm"
                        component="a"
                        href="/admin/leave-types"
                        leftSection={<ArrowLeft size={14} />}
                        style={{ marginBottom: 1 }}
                    >
                        Leaves
                    </MantineButton>
                </div>

                {/* ── Table ── */}
                <div className="flex-1 overflow-auto px-6 pb-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader size="sm" />
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-20 text-center">
                            <CalendarDays size={28} className="text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                {search ? 'No holidays match your search.' : `No holidays for ${year}.`}
                            </p>
                            {!search && (
                                <MantineButton
                                    variant="subtle"
                                    size="xs"
                                    leftSection={<Plus size={12} />}
                                    onClick={() => setShowAdd(true)}
                                >
                                    Add one
                                </MantineButton>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border">
                            <Table highlightOnHover verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: 200 }}>Date</Table.Th>
                                        <Table.Th>Holiday</Table.Th>
                                        <Table.Th style={{ width: 120 }}>Type</Table.Th>
                                        <Table.Th style={{ width: 56 }} />
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {visible.map(holiday => {
                                        const meta = TYPE_META[holiday.type];
                                        return (
                                            <Table.Tr
                                                key={holiday.id}
                                                style={{
                                                    borderLeft: `3px solid ${meta.accent}`,
                                                }}
                                            >
                                                <Table.Td>
                                                    <Text size="sm" ff="monospace" fw={500}>
                                                        {new Date(holiday.date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>{holiday.name}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color={meta.color}
                                                        variant="light"
                                                        size="sm"
                                                        radius="sm"
                                                    >
                                                        {meta.label}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Tooltip label="Delete" withArrow position="left">
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="red"
                                                            size="sm"
                                                            loading={deletingId === holiday.id}
                                                            onClick={() => handleDeleteHoliday(holiday.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Add Holiday Modal ── */}
            <Modal
                opened={showAdd}
                onClose={() => setShowAdd(false)}
                title="Add holiday"
                size="sm"
                centered
            >
                <Stack gap="sm">
                    <div>
                        <Text size="sm" fw={500} mb={4}>Date</Text>
                        <DateInput
                            size="sm"
                            placeholder="Pick a date"
                            value={formData.date ? new Date(formData.date + 'T00:00:00') : null}
                            onChange={date =>
                                setFormData({ ...formData, date: date ? date.toString().split('T')[0] : '' })
                            }
                        />
                    </div>
                    <TextInput
                        size="sm"
                        label="Name"
                        placeholder="e.g. Independence Day"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.currentTarget.value })}
                    />
                    <Select
                        size="sm"
                        label="Type"
                        value={formData.type}
                        onChange={val =>
                            setFormData({ ...formData, type: val as AddHolidayFormData['type'] })
                        }
                        data={[
                            { value: 'national',   label: 'National' },
                            { value: 'state',      label: 'State' },
                            { value: 'restricted', label: 'Restricted' },
                        ]}
                    />
                    <Group justify="flex-end" mt="xs">
                        <MantineButton variant="default" size="sm" onClick={() => setShowAdd(false)}>
                            Cancel
                        </MantineButton>
                        <MantineButton size="sm" loading={saving} onClick={handleAddHoliday}>
                            Add holiday
                        </MantineButton>
                    </Group>
                </Stack>
            </Modal>

            {/* ── Copy Year Modal ── */}
            <Modal
                opened={showCopy}
                onClose={() => setShowCopy(false)}
                title="Copy holiday calendar"
                size="sm"
                centered
            >
                <Stack gap="sm">
                    <Alert color="blue" variant="light" py="xs">
                        Copies all holidays from one year to another, adjusting dates automatically.
                    </Alert>
                    <Select
                        size="sm"
                        label="From year"
                        value={copyForm.from_year.toString()}
                        onChange={val =>
                            setCopyForm({ ...copyForm, from_year: parseInt(val || '2025') })
                        }
                        data={YEARS.map(y => ({ value: y, label: y }))}
                    />
                    <Select
                        size="sm"
                        label="To year"
                        value={copyForm.to_year.toString()}
                        onChange={val =>
                            setCopyForm({ ...copyForm, to_year: parseInt(val || '2026') })
                        }
                        data={YEARS.map(y => ({ value: y, label: y }))}
                    />
                    <Group justify="flex-end" mt="xs">
                        <MantineButton variant="default" size="sm" onClick={() => setShowCopy(false)}>
                            Cancel
                        </MantineButton>
                        <MantineButton size="sm" loading={saving} leftSection={<Copy size={14} />} onClick={handleCopyYear}>
                            Copy holidays
                        </MantineButton>
                    </Group>
                </Stack>
            </Modal>
        </AppLayout>
    );
}