import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowLeft, Copy, Calendar } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    Alert,
    Badge,
    Dialog,
    Group,
    Loader,
    Stack,
    Tabs,
    Table,
    TextInput,
    Select,
    Button as MantineButton,
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
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Holidays',
        href: '/admin/holidays',
    },
];

const typeColors: Record<string, string> = {
    national: 'blue',
    state: 'green',
    restricted: 'orange',
};

export default function HolidaysIndex() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState<AddHolidayFormData>({
        date: '',
        name: '',
        type: 'national',
    });
    const [copyFormData, setCopyFormData] = useState({
        from_year: new Date().getFullYear(),
        to_year: new Date().getFullYear() + 1,
    });

    useEffect(() => {
        fetchHolidays();
    }, [year, typeFilter]);

    async function fetchHolidays() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ year: year.toString() });
            if (typeFilter) params.append('type', typeFilter);
            const { data } = await axios.get(`/api/holidays?${params}`);
            setHolidays(data.holidays || []);
        } catch (error) {
            console.error('Error fetching holidays:', error);
            setHolidays([]);
        } finally {
            setLoading(false);
        }
    }

    const handleAddHoliday = async () => {
        if (!formData.date || !formData.name) {
            setMessage({ type: 'error', text: 'Please fill all fields.' });
            return;
        }

        setSaving(true);
        try {
            await axios.post('/api/holidays', formData);
            setMessage({ type: 'success', text: 'Holiday added successfully.' });
            setFormData({ date: '', name: '', type: 'national' });
            setShowAddDialog(false);
            fetchHolidays();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to add holiday.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHoliday = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;

        try {
            await axios.delete(`/api/holidays/d/${id}`);
            setMessage({ type: 'success', text: 'Holiday deleted successfully.' });
            fetchHolidays();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to delete holiday.',
            });
        }
    };

    const handleCopyYear = async () => {
        setSaving(true);
        try {
            await axios.patch('/api/holidays/copy_year', copyFormData);
            setMessage({ type: 'success', text: `Holidays copied to ${copyFormData.to_year}.` });
            setShowCopyDialog(false);
            setYear(copyFormData.to_year);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to copy holidays.',
            });
        } finally {
            setSaving(false);
        }
    };

    const filteredHolidays = typeFilter
        ? holidays.filter((h) => h.type === typeFilter)
        : holidays;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Holiday Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Holiday Management</h1>
                        <p className="text-muted-foreground">Manage public holidays and special dates</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/leave-types">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Leaves
                            </Link>
                        </Button>
                    </div>
                </div>

                {message && (
                    <Alert
                        color={message.type === 'success' ? 'green' : 'red'}
                        title={message.type === 'success' ? 'Success' : 'Error'}
                    >
                        {message.text}
                    </Alert>
                )}

                <Tabs defaultValue="calendar">
                    <Tabs.List>
                        <Tabs.Tab value="calendar" leftSection={<Calendar size={16} />}>
                            Holidays ({filteredHolidays.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="add" leftSection={<Plus size={16} />}>
                            Add Holiday
                        </Tabs.Tab>
                        <Tabs.Tab value="copy" leftSection={<Copy size={16} />}>
                            Copy Year
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="calendar" pt="md">
                        <Stack gap="md">
                            <Group grow align="end">
                                <Select
                                    label="Year"
                                    value={year.toString()}
                                    onChange={(val) => setYear(parseInt(val || '2026'))}
                                    data={[
                                        { value: '2024', label: '2024' },
                                        { value: '2025', label: '2025' },
                                        { value: '2026', label: '2026' },
                                        { value: '2027', label: '2027' },
                                        { value: '2028', label: '2028' },
                                    ]}
                                />
                                <Select
                                    label="Type"
                                    placeholder="All Types"
                                    clearable
                                    value={typeFilter}
                                    onChange={setTypeFilter}
                                    data={[
                                        { value: 'national', label: 'National' },
                                        { value: 'state', label: 'State' },
                                        { value: 'restricted', label: 'Restricted' },
                                    ]}
                                />
                            </Group>

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader />
                                </div>
                            ) : filteredHolidays.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center">
                                    <p className="text-sm text-muted-foreground">No holidays found for {year}.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border">
                                    <Table striped highlightOnHover>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHolidays
                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                .map((holiday) => (
                                                    <tr key={holiday.id}>
                                                        <td className="font-mono font-semibold">
                                                            {new Date(holiday.date).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </td>
                                                        <td className="font-medium">{holiday.name}</td>
                                                        <td>
                                                            <Badge color={typeColors[holiday.type]} variant="light">
                                                                {holiday.type}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <MantineButton
                                                                size="xs"
                                                                color="red"
                                                                variant="outline"
                                                                leftSection={<Trash2 size={14} />}
                                                                onClick={() => handleDeleteHoliday(holiday.id)}
                                                            >
                                                                Delete
                                                            </MantineButton>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="add" pt="md">
                        <Stack gap="md" maw={600}>
                            <div>
                                <label className="text-sm font-medium">Date</label>
                                <DateInput
                                    placeholder="Select date"
                                    value={formData.date ? new Date(formData.date) : null}
                                    onChange={(date) =>
                                        setFormData({
                                            ...formData,
                                            date: date ? date.toString().split('T')[0] : '',
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Holiday Name</label>
                                <TextInput
                                    placeholder="e.g., Independence Day"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.currentTarget.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Type</label>
                                <Select
                                    value={formData.type}
                                    onChange={(val) =>
                                        setFormData({
                                            ...formData,
                                            type: val as 'national' | 'state' | 'restricted',
                                        })
                                    }
                                    data={[
                                        { value: 'national', label: 'National' },
                                        { value: 'state', label: 'State' },
                                        { value: 'restricted', label: 'Restricted' },
                                    ]}
                                />
                            </div>

                            <MantineButton onClick={handleAddHoliday} loading={saving}>
                                Add Holiday
                            </MantineButton>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="copy" pt="md">
                        <Stack gap="md" maw={600}>
                            <Alert color="blue" title="Copy Holiday Calendar">
                                This will copy all holidays from one year to another. Dates will be automatically adjusted.
                            </Alert>

                            <Select
                                label="Copy From Year"
                                value={copyFormData.from_year.toString()}
                                onChange={(val) =>
                                    setCopyFormData({
                                        ...copyFormData,
                                        from_year: parseInt(val || '2026'),
                                    })
                                }
                                data={[
                                    { value: '2024', label: '2024' },
                                    { value: '2025', label: '2025' },
                                    { value: '2026', label: '2026' },
                                    { value: '2027', label: '2027' },
                                ]}
                            />

                            <Select
                                label="Copy To Year"
                                value={copyFormData.to_year.toString()}
                                onChange={(val) =>
                                    setCopyFormData({
                                        ...copyFormData,
                                        to_year: parseInt(val || '2027'),
                                    })
                                }
                                data={[
                                    { value: '2025', label: '2025' },
                                    { value: '2026', label: '2026' },
                                    { value: '2027', label: '2027' },
                                    { value: '2028', label: '2028' },
                                ]}
                            />

                            <MantineButton
                                onClick={handleCopyYear}
                                loading={saving}
                                color="blue"
                                leftSection={<Copy size={16} />}
                            >
                                Copy Holidays
                            </MantineButton>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </div>
        </AppLayout>
    );
}
