import { SalesLeadEmptyState } from '@/components/sales-leads/SalesLeadEmptyState';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Drawer,
    Group,
    Loader,
    Pagination,
    Paper,
    ScrollArea,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
    Tooltip,
} from '@mantine/core';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import {
    BarChart3,
    Bell,
    CalendarClock,
    Download,
    Edit,
    Eye,
    Filter,
    Handshake,
    ListChecks,
    MessageSquarePlus,
    Plus,
    Save,
    Search,
    Trash,
    Trophy,
    Users,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
    salesLeadActivityTypes,
    salesLeadInterestLevels,
    salesLeadOrganizationTypes,
    salesLeadStatuses,
    type SalesLead,
    type SalesLeadActivityFormData,
    type SalesLeadFormData,
    type SalesLeadMetrics,
    type SalesLeadPagination,
    type SalesLeadProductOption,
    type SalesLeadReport,
    type SalesLeadUserOption,
} from '@/types/sales-leads';

interface SalesLeadWorkspaceProps {
    mode: 'admin' | 'my';
    products: SalesLeadProductOption[];
    salesUsers?: SalesLeadUserOption[];
}

const emptyMetrics: SalesLeadMetrics = {
    total: 0,
    positive: 0,
    overdue_followups: 0,
    upcoming_followups: 0,
    employees_active: 0,
};

const emptyPagination: SalesLeadPagination = {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
};

const defaultLeadForm: SalesLeadFormData = {
    owner_user_id: '',
    product_id: '',
    organization_name: '',
    organization_type: 'other',
    contact_person_name: '',
    contact_phone: '',
    contact_email: '',
    location: '',
    service_notes: '',
    interest_level: 'unclear',
    status: 'new',
    source: '',
    latest_response: '',
    last_contacted_at: '',
    next_follow_up_at: '',
    notes: '',
};

const defaultActivityForm: SalesLeadActivityFormData = {
    activity_type: 'call',
    outcome_status: '',
    interest_level: '',
    response_text: '',
    activity_at: new Date().toISOString().slice(0, 16),
    next_follow_up_at: '',
};

function humanize(value: string): string {
    return value.replace(/_/g, ' ');
}

function titleize(value: string): string {
    return humanize(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toInputDateTime(value?: string | null): string {
    if (!value) {
        return '';
    }

    return value.replace(' ', 'T').slice(0, 16);
}

function cleanPayload<T extends Record<keyof T, string>>(data: T) {
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]),
    );
}

function formFromLead(lead: SalesLead): SalesLeadFormData {
    return {
        owner_user_id: lead.owner_user_id.toString(),
        product_id: lead.product_id?.toString() ?? '',
        organization_name: lead.organization_name,
        organization_type: lead.organization_type,
        contact_person_name: lead.contact_person_name ?? '',
        contact_phone: lead.contact_phone ?? '',
        contact_email: lead.contact_email ?? '',
        location: lead.location ?? '',
        service_notes: lead.service_notes ?? '',
        interest_level: lead.interest_level,
        status: lead.status,
        source: lead.source ?? '',
        latest_response: lead.latest_response ?? '',
        last_contacted_at: toInputDateTime(lead.last_contacted_at),
        next_follow_up_at: toInputDateTime(lead.next_follow_up_at),
        notes: lead.notes ?? '',
    };
}

function formatDate(value?: string | null): string {
    if (!value) {
        return 'Not set';
    }

    return new Date(value).toLocaleString();
}

function interestColor(level: SalesLead['interest_level']): string {
    return {
        negative: 'red',
        unclear: 'gray',
        positive: 'green',
    }[level];
}

function statusColor(status: SalesLead['status']): string {
    return {
        new: 'blue',
        contacted: 'cyan',
        follow_up: 'yellow',
        interested: 'green',
        not_interested: 'gray',
        won: 'teal',
        lost: 'red',
    }[status];
}

export function SalesLeadWorkspace({
    mode,
    products,
    salesUsers = [],
}: SalesLeadWorkspaceProps) {
    const isAdmin = mode === 'admin';
    const endpoints = useMemo(
        () => ({
            data: isAdmin ? '/admin/data/sales-leads' : '/data/my/sales-leads',
            store: isAdmin ? '/admin/sales-leads' : '/my/sales-leads',
            update: (lead: SalesLead) =>
                isAdmin ? `/admin/sales-leads/${lead.id}` : `/my/sales-leads/${lead.id}`,
            destroy: (lead: SalesLead) => `/admin/sales-leads/${lead.id}`,
            activity: (lead: SalesLead) =>
                isAdmin
                    ? `/admin/sales-leads/${lead.id}/activities`
                    : `/my/sales-leads/${lead.id}/activities`,
            show: (lead: SalesLead) =>
                isAdmin ? `/admin/sales-leads/${lead.id}` : `/my/sales-leads/${lead.id}`,
            closeDeal: (lead: SalesLead) =>
                isAdmin
                    ? `/admin/sales-leads/${lead.id}/close-deal`
                    : `/my/sales-leads/${lead.id}/close-deal`,
            report: '/admin/data/sales-leads/report',
            export: '/admin/sales-leads/export',
            reminders: '/admin/sales-leads/reminders/send',
        }),
        [isAdmin],
    );

    const [leads, setLeads] = useState<SalesLead[]>([]);
    const [metrics, setMetrics] = useState<SalesLeadMetrics>(emptyMetrics);
    const [pagination, setPagination] = useState<SalesLeadPagination>(emptyPagination);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingLead, setEditingLead] = useState<SalesLead | null>(null);
    const [activityLead, setActivityLead] = useState<SalesLead | null>(null);
    const [report, setReport] = useState<SalesLeadReport | null>(null);
    const [leadForm, setLeadForm] = useState<SalesLeadFormData>(defaultLeadForm);
    const [activityForm, setActivityForm] = useState<SalesLeadActivityFormData>(defaultActivityForm);
    const [filters, setFilters] = useState({
        search: '',
        owner_user_id: '',
        product_id: '',
        status: 'all',
        interest_level: 'all',
        organization_type: 'all',
        follow_up: 'all',
    });

    const salesUserOptions = useMemo(
        () => salesUsers.map((user) => ({ value: user.id.toString(), label: user.name })),
        [salesUsers],
    );
    const productOptions = useMemo(
        () => products.map((product) => ({ value: product.id.toString(), label: product.name })),
        [products],
    );
    const statusOptions = salesLeadStatuses.map((status) => ({ value: status, label: titleize(status) }));
    const interestOptions = salesLeadInterestLevels.map((level) => ({ value: level, label: titleize(level) }));
    const organizationTypeOptions = salesLeadOrganizationTypes.map((type) => ({ value: type, label: titleize(type) }));

    const loadLeads = useCallback(
        async (page = 1) => {
            setLoading(true);
            setError(null);
            setNotice(null);

            try {
                const response = await axios.get(endpoints.data, {
                    params: {
                        page,
                        ...filters,
                    },
                });

                setLeads(response.data.leads ?? []);
                setPagination(response.data.pagination ?? emptyPagination);
                setMetrics(response.data.metrics ?? emptyMetrics);

                if (isAdmin) {
                    const reportResponse = await axios.get(endpoints.report, {
                        params: filters,
                    });
                    setReport(reportResponse.data);
                }
            } catch {
                setError('Unable to load sales leads.');
            } finally {
                setLoading(false);
            }
        },
        [endpoints.data, endpoints.report, filters, isAdmin],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadLeads(1);
        }, 250);

        return () => window.clearTimeout(timer);
    }, [loadLeads]);

    const metricCards = [
        {
            label: isAdmin ? 'Total Leads' : 'My Leads',
            value: metrics.total,
            description: 'Generated in the current filter',
            icon: ListChecks,
            color: 'blue',
        },
        {
            label: 'Positive Leads',
            value: metrics.positive,
            description: 'Prospects marked positive',
            icon: Handshake,
            color: 'green',
        },
        {
            label: 'Follow-ups',
            value: metrics.upcoming_followups + metrics.overdue_followups,
            description: `${metrics.overdue_followups} overdue, ${metrics.upcoming_followups} upcoming`,
            icon: CalendarClock,
            color: 'yellow',
        },
        {
            label: isAdmin ? 'Active Employees' : 'Activities',
            value: isAdmin
                ? metrics.employees_active
                : leads.reduce((sum, lead) => sum + (lead.activities_count ?? 0), 0),
            description: isAdmin ? 'Employees with matching leads' : 'Recorded follow-up entries',
            icon: Users,
            color: 'violet',
        },
    ];

    const startCreate = () => {
        setEditingLead(null);
        setLeadForm({
            ...defaultLeadForm,
            owner_user_id: salesUsers[0]?.id.toString() ?? '',
        });
        setShowForm(true);
        setError(null);
        setNotice(null);
    };

    const startEdit = (lead: SalesLead) => {
        setEditingLead(lead);
        setLeadForm(formFromLead(lead));
        setShowForm(true);
        setError(null);
        setNotice(null);
    };

    const submitLead = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setNotice(null);

        try {
            const payload = cleanPayload(leadForm);

            if (editingLead) {
                await axios.patch(endpoints.update(editingLead), payload);
            } else {
                await axios.post(endpoints.store, payload);
            }

            setShowForm(false);
            setEditingLead(null);
            setLeadForm(defaultLeadForm);
            await loadLeads(pagination.current_page);
        } catch (caught) {
            if (axios.isAxiosError(caught)) {
                setError(caught.response?.data?.message ?? 'Unable to save sales lead.');
            } else {
                setError('Unable to save sales lead.');
            }
        } finally {
            setSaving(false);
        }
    };

    const submitActivity = async (event: FormEvent) => {
        event.preventDefault();

        if (!activityLead) {
            return;
        }

        setSaving(true);
        setError(null);
        setNotice(null);

        try {
            await axios.post(endpoints.activity(activityLead), cleanPayload(activityForm));
            setActivityLead(null);
            setActivityForm(defaultActivityForm);
            await loadLeads(pagination.current_page);
        } catch (caught) {
            if (axios.isAxiosError(caught)) {
                setError(caught.response?.data?.message ?? 'Unable to record activity.');
            } else {
                setError('Unable to record activity.');
            }
        } finally {
            setSaving(false);
        }
    };

    const archiveLead = async (lead: SalesLead) => {
        if (!isAdmin || !window.confirm('Archive this sales lead?')) {
            return;
        }

        setSaving(true);

        try {
            await axios.delete(endpoints.destroy(lead));
            await loadLeads(pagination.current_page);
        } finally {
            setSaving(false);
        }
    };

    const closeDeal = async (lead: SalesLead) => {
        if (lead.status === 'won' || !window.confirm(`Close ${lead.organization_name} as won?`)) {
            return;
        }

        setSaving(true);
        setError(null);
        setNotice(null);

        try {
            const response = await axios.post(endpoints.closeDeal(lead), {
                response_text: 'Deal closed as won.',
            });
            setNotice(response.data.message ?? 'Deal closed as won.');
            await loadLeads(pagination.current_page);
        } catch (caught) {
            if (axios.isAxiosError(caught)) {
                setError(caught.response?.data?.message ?? 'Unable to close deal.');
            } else {
                setError('Unable to close deal.');
            }
        } finally {
            setSaving(false);
        }
    };

    const exportLeads = () => {
        const params = new URLSearchParams(
            Object.fromEntries(
                Object.entries(filters).filter(([, value]) => value && value !== 'all'),
            ),
        );
        window.location.href = `${endpoints.export}?${params.toString()}`;
    };

    const sendReminders = async () => {
        if (!isAdmin || !window.confirm('Send overdue follow-up reminders to assigned sales employees?')) {
            return;
        }

        setSaving(true);
        setError(null);
        setNotice(null);

        try {
            const response = await axios.post(endpoints.reminders);
            setNotice(response.data.message ?? 'Sales follow-up reminders sent.');
        } catch {
            setError('Unable to send follow-up reminders.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
            <Paper withBorder radius="md" p="lg">
                <Group justify="space-between" align="flex-end" gap="lg">
                    <Stack gap={4}>
                        <Text size="xs" fw={700} tt="uppercase" c="blue">
                            {isAdmin ? 'Sales CRM' : 'Sales Work'}
                        </Text>
                        <Title order={1} size="h2">
                            {isAdmin ? 'Sales Leads' : 'My Sales Leads'}
                        </Title>
                        <Text c="dimmed" size="sm">
                            Track prospects and sales contact people separately from existing clients.
                        </Text>
                    </Stack>

                    <Group gap="sm">
                        {isAdmin ? (
                            <>
                                <Button variant="default" leftSection={<Download size={16} />} onClick={exportLeads}>
                                    Export CSV
                                </Button>
                                <Button
                                    variant="light"
                                    leftSection={<Bell size={16} />}
                                    loading={saving}
                                    onClick={sendReminders}
                                >
                                    Send Reminders
                                </Button>
                            </>
                        ) : null}
                        <Button leftSection={<Plus size={16} />} onClick={startCreate}>
                            {isAdmin ? 'Create Lead' : 'New Lead'}
                        </Button>
                    </Group>
                </Group>
            </Paper>

            {error ? (
                <Alert color="red" variant="light">
                    {error}
                </Alert>
            ) : null}

            {notice ? (
                <Alert color="green" variant="light">
                    {notice}
                </Alert>
            ) : null}

            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }}>
                {metricCards.map((metric) => (
                    <Card key={metric.label} withBorder radius="md" padding="lg">
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                                <Text size="sm" c="dimmed">
                                    {metric.label}
                                </Text>
                                <Title order={2}>{metric.value}</Title>
                                <Text size="xs" c="dimmed">
                                    {metric.description}
                                </Text>
                            </Stack>
                            <ThemeIcon variant="light" color={metric.color} radius="md" size={42}>
                                <metric.icon size={20} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            {isAdmin && report ? (
                <Card withBorder radius="md" padding="lg">
                    <Group justify="space-between" mb="md">
                        <Group gap="sm">
                            <ThemeIcon variant="light" color="blue" radius="md">
                                <BarChart3 size={18} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Title order={3}>Sales Performance</Title>
                                <Text size="sm" c="dimmed">
                                    Filter-aware lead generation, outcomes, and service interest summary.
                                </Text>
                            </Stack>
                        </Group>
                    </Group>

                    <SimpleGrid cols={{ base: 1, lg: 3 }}>
                        <Paper withBorder radius="md" p="md">
                            <Text fw={600}>By Employee</Text>
                            <Stack gap="xs" mt="md">
                                {report.by_employee.slice(0, 5).map((row) => (
                                    <Group key={row.owner_user_id ?? row.owner_name} justify="space-between" gap="md">
                                        <Text size="sm">{row.owner_name}</Text>
                                        <Text size="sm" c="dimmed">
                                            {row.total} leads, {row.positive} positive, {row.won} won
                                        </Text>
                                    </Group>
                                ))}
                                {report.by_employee.length === 0 ? <Text size="sm" c="dimmed">No employee data</Text> : null}
                            </Stack>
                        </Paper>

                        <Paper withBorder radius="md" p="md">
                            <Text fw={600}>By Service</Text>
                            <Stack gap="xs" mt="md">
                                {report.by_product.slice(0, 5).map((row) => (
                                    <Group key={row.product_id ?? row.product_name} justify="space-between" gap="md">
                                        <Text size="sm">{row.product_name}</Text>
                                        <Text size="sm" c="dimmed">
                                            {row.total} leads, {row.positive} positive
                                        </Text>
                                    </Group>
                                ))}
                                {report.by_product.length === 0 ? <Text size="sm" c="dimmed">No service data</Text> : null}
                            </Stack>
                        </Paper>

                        <Paper withBorder radius="md" p="md">
                            <Text fw={600}>Outcomes</Text>
                            <SimpleGrid cols={2} mt="md" spacing="xs">
                                <Text size="sm">Won</Text>
                                <Text size="sm" c="dimmed" ta="right">{metrics.won ?? 0}</Text>
                                <Text size="sm">Lost</Text>
                                <Text size="sm" c="dimmed" ta="right">{metrics.lost ?? 0}</Text>
                                <Text size="sm">Follow-ups completed</Text>
                                <Text size="sm" c="dimmed" ta="right">{report.followups_completed}</Text>
                            </SimpleGrid>
                        </Paper>
                    </SimpleGrid>
                </Card>
            ) : null}

            <Card withBorder radius="md" padding="lg">
                <Group justify="space-between" mb="md" align="flex-start">
                    <Stack gap={2}>
                        <Group gap="xs">
                            <Filter size={18} />
                            <Title order={3}>Lead Directory</Title>
                        </Group>
                        <Text size="sm" c="dimmed">
                            Search, filter, and manage sales prospects.
                        </Text>
                    </Stack>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, lg: isAdmin ? 6 : 5 }} mb="lg">
                    <TextInput
                        leftSection={<Search size={16} />}
                        placeholder="Search prospects"
                        value={filters.search}
                        onChange={(event) =>
                            setFilters((current) => ({ ...current, search: event.target.value }))
                        }
                    />

                    {isAdmin ? (
                        <Select
                            placeholder="Employee"
                            data={[{ value: 'all', label: 'All employees' }, ...salesUserOptions]}
                            value={filters.owner_user_id || 'all'}
                            onChange={(value) =>
                                setFilters((current) => ({
                                    ...current,
                                    owner_user_id: value === 'all' ? '' : value ?? '',
                                }))
                            }
                        />
                    ) : null}

                    <Select
                        placeholder="Service"
                        data={[{ value: 'all', label: 'All services' }, ...productOptions]}
                        value={filters.product_id || 'all'}
                        onChange={(value) =>
                            setFilters((current) => ({
                                ...current,
                                product_id: value === 'all' ? '' : value ?? '',
                            }))
                        }
                    />
                    <Select
                        placeholder="Status"
                        data={[{ value: 'all', label: 'All statuses' }, ...statusOptions]}
                        value={filters.status}
                        onChange={(value) => setFilters((current) => ({ ...current, status: value ?? 'all' }))}
                    />
                    <Select
                        placeholder="Interest"
                        data={[{ value: 'all', label: 'All interest' }, ...interestOptions]}
                        value={filters.interest_level}
                        onChange={(value) => setFilters((current) => ({ ...current, interest_level: value ?? 'all' }))}
                    />
                    <Select
                        placeholder="Follow-up"
                        data={[
                            { value: 'all', label: 'All follow-ups' },
                            { value: 'overdue', label: 'Overdue' },
                            { value: 'upcoming', label: 'Upcoming' },
                            { value: 'none', label: 'No follow-up' },
                        ]}
                        value={filters.follow_up}
                        onChange={(value) => setFilters((current) => ({ ...current, follow_up: value ?? 'all' }))}
                    />
                </SimpleGrid>

                {loading ? (
                    <Group justify="center" py="xl">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">Loading sales leads...</Text>
                    </Group>
                ) : leads.length === 0 ? (
                    <SalesLeadEmptyState
                        title="No sales leads found"
                        description="Create a prospect record when a sales employee contacts an organization, school, college, or business."
                        actionLabel="Use Create Lead"
                    />
                ) : (
                    <ScrollArea>
                        <Table striped highlightOnHover verticalSpacing="md" miw={980}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Prospect</Table.Th>
                                    <Table.Th>Contact</Table.Th>
                                    <Table.Th>Service</Table.Th>
                                    {isAdmin ? <Table.Th>Owner</Table.Th> : null}
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Follow-up</Table.Th>
                                    <Table.Th ta="right">Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {leads.map((lead) => (
                                    <Table.Tr key={lead.id}>
                                        <Table.Td>
                                            <Stack gap={4}>
                                                <Group gap="xs">
                                                    <Text fw={600}>{lead.organization_name}</Text>
                                                    <Badge variant="light" color="gray">
                                                        {titleize(lead.organization_type)}
                                                    </Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                    {lead.location || 'No location'}
                                                </Text>
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                <Text size="sm">{lead.contact_person_name || 'Not added'}</Text>
                                                <Text size="xs" c="dimmed">{lead.contact_phone || lead.contact_email || 'No contact info'}</Text>
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>{lead.product?.name || 'Not selected'}</Table.Td>
                                        {isAdmin ? <Table.Td>{lead.owner?.name || 'Unassigned'}</Table.Td> : null}
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Badge color={interestColor(lead.interest_level)} variant="light">
                                                    {titleize(lead.interest_level)}
                                                </Badge>
                                                <Badge color={statusColor(lead.status)} variant="dot">
                                                    {titleize(lead.status)}
                                                </Badge>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                <Text size="sm">{formatDate(lead.next_follow_up_at)}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {lead.activities_count ?? 0} activities
                                                </Text>
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end" gap="xs" wrap="nowrap">
                                                <Tooltip label="View lead">
                                                    <ActionIcon variant="subtle" component={Link} href={endpoints.show(lead)}>
                                                        <Eye size={17} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Record activity">
                                                    <ActionIcon variant="subtle" onClick={() => setActivityLead(lead)}>
                                                        <MessageSquarePlus size={17} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Edit lead">
                                                    <ActionIcon variant="subtle" onClick={() => startEdit(lead)}>
                                                        <Edit size={17} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label={lead.status === 'won' ? 'Deal already closed' : 'Close as won'}>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="teal"
                                                        disabled={lead.status === 'won'}
                                                        loading={saving}
                                                        onClick={() => closeDeal(lead)}
                                                    >
                                                        <Trophy size={17} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                {isAdmin ? (
                                                    <Tooltip label="Archive lead">
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="red"
                                                            loading={saving}
                                                            onClick={() => archiveLead(lead)}
                                                        >
                                                            <Trash size={17} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                ) : null}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}

                {pagination.last_page > 1 ? (
                    <>
                        <Divider my="md" />
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">
                                Page {pagination.current_page} of {pagination.last_page}, {pagination.total} leads
                            </Text>
                            <Pagination
                                total={pagination.last_page}
                                value={pagination.current_page}
                                onChange={(page) => loadLeads(page)}
                                disabled={loading}
                            />
                        </Group>
                    </>
                ) : null}
            </Card>

            <Drawer
                opened={showForm}
                onClose={() => setShowForm(false)}
                position="right"
                size="xl"
                title={editingLead ? 'Edit Sales Lead' : 'Create Sales Lead'}
                padding="lg"
            >
                <form onSubmit={submitLead}>
                    <Stack gap="md">
                        {isAdmin ? (
                            <Select
                                label="Owner"
                                data={salesUserOptions}
                                value={leadForm.owner_user_id}
                                onChange={(value) =>
                                    setLeadForm((current) => ({ ...current, owner_user_id: value ?? '' }))
                                }
                                required
                            />
                        ) : null}
                        <TextInput
                            label="Organization"
                            value={leadForm.organization_name}
                            onChange={(event) =>
                                setLeadForm((current) => ({ ...current, organization_name: event.target.value }))
                            }
                            required
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <Select
                                label="Organization type"
                                data={organizationTypeOptions}
                                value={leadForm.organization_type}
                                onChange={(value) =>
                                    setLeadForm((current) => ({
                                        ...current,
                                        organization_type: (value ?? 'other') as SalesLeadFormData['organization_type'],
                                    }))
                                }
                            />
                            <Select
                                label="Service"
                                data={productOptions}
                                value={leadForm.product_id}
                                onChange={(value) => setLeadForm((current) => ({ ...current, product_id: value ?? '' }))}
                                clearable
                            />
                            <Select
                                label="Interest"
                                data={interestOptions}
                                value={leadForm.interest_level}
                                onChange={(value) =>
                                    setLeadForm((current) => ({
                                        ...current,
                                        interest_level: (value ?? 'unclear') as SalesLeadFormData['interest_level'],
                                    }))
                                }
                            />
                            <Select
                                label="Status"
                                data={statusOptions}
                                value={leadForm.status}
                                onChange={(value) =>
                                    setLeadForm((current) => ({
                                        ...current,
                                        status: (value ?? 'new') as SalesLeadFormData['status'],
                                    }))
                                }
                            />
                        </SimpleGrid>
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <TextInput
                                label="Contact person"
                                value={leadForm.contact_person_name}
                                onChange={(event) =>
                                    setLeadForm((current) => ({ ...current, contact_person_name: event.target.value }))
                                }
                            />
                            <TextInput
                                label="Phone"
                                value={leadForm.contact_phone}
                                onChange={(event) =>
                                    setLeadForm((current) => ({ ...current, contact_phone: event.target.value }))
                                }
                            />
                            <TextInput
                                label="Email"
                                type="email"
                                value={leadForm.contact_email}
                                onChange={(event) =>
                                    setLeadForm((current) => ({ ...current, contact_email: event.target.value }))
                                }
                            />
                            <TextInput
                                label="Location"
                                value={leadForm.location}
                                onChange={(event) =>
                                    setLeadForm((current) => ({ ...current, location: event.target.value }))
                                }
                            />
                            <TextInput
                                label="Source"
                                value={leadForm.source}
                                onChange={(event) =>
                                    setLeadForm((current) => ({ ...current, source: event.target.value }))
                                }
                            />
                            <TextInput
                                label="Next follow-up"
                                type="datetime-local"
                                value={leadForm.next_follow_up_at}
                                onChange={(event) =>
                                    setLeadForm((current) => ({ ...current, next_follow_up_at: event.target.value }))
                                }
                            />
                        </SimpleGrid>
                        <Textarea
                            label="Latest response"
                            minRows={3}
                            value={leadForm.latest_response}
                            onChange={(event) =>
                                setLeadForm((current) => ({ ...current, latest_response: event.target.value }))
                            }
                        />
                        <Textarea
                            label="Service notes"
                            minRows={3}
                            value={leadForm.service_notes}
                            onChange={(event) =>
                                setLeadForm((current) => ({ ...current, service_notes: event.target.value }))
                            }
                        />
                        <Textarea
                            label="Internal notes"
                            minRows={3}
                            value={leadForm.notes}
                            onChange={(event) =>
                                setLeadForm((current) => ({ ...current, notes: event.target.value }))
                            }
                        />
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={saving} leftSection={<Save size={16} />}>
                                Save Lead
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Drawer>

            <Drawer
                opened={Boolean(activityLead)}
                onClose={() => setActivityLead(null)}
                position="right"
                size="lg"
                title={activityLead ? `Record Activity: ${activityLead.organization_name}` : 'Record Activity'}
                padding="lg"
            >
                <form onSubmit={submitActivity}>
                    <Stack gap="md">
                        <Select
                            label="Activity type"
                            data={salesLeadActivityTypes.map((type) => ({ value: type, label: titleize(type) }))}
                            value={activityForm.activity_type}
                            onChange={(value) =>
                                setActivityForm((current) => ({
                                    ...current,
                                    activity_type: (value ?? 'call') as SalesLeadActivityFormData['activity_type'],
                                }))
                            }
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <Select
                                label="Outcome status"
                                data={[{ value: 'no-change', label: 'Do not change status' }, ...statusOptions]}
                                value={activityForm.outcome_status || 'no-change'}
                                onChange={(value) =>
                                    setActivityForm((current) => ({
                                        ...current,
                                        outcome_status:
                                            value === 'no-change'
                                                ? ''
                                                : ((value ?? '') as SalesLeadActivityFormData['outcome_status']),
                                    }))
                                }
                            />
                            <Select
                                label="Interest level"
                                data={[{ value: 'no-change', label: 'Do not change interest' }, ...interestOptions]}
                                value={activityForm.interest_level || 'no-change'}
                                onChange={(value) =>
                                    setActivityForm((current) => ({
                                        ...current,
                                        interest_level:
                                            value === 'no-change'
                                                ? ''
                                                : ((value ?? '') as SalesLeadActivityFormData['interest_level']),
                                    }))
                                }
                            />
                            <TextInput
                                label="Activity date"
                                type="datetime-local"
                                value={activityForm.activity_at}
                                onChange={(event) =>
                                    setActivityForm((current) => ({ ...current, activity_at: event.target.value }))
                                }
                                required
                            />
                            <TextInput
                                label="Next follow-up"
                                type="datetime-local"
                                value={activityForm.next_follow_up_at}
                                onChange={(event) =>
                                    setActivityForm((current) => ({
                                        ...current,
                                        next_follow_up_at: event.target.value,
                                    }))
                                }
                            />
                        </SimpleGrid>
                        <Textarea
                            label="Response or notes"
                            minRows={5}
                            value={activityForm.response_text}
                            onChange={(event) =>
                                setActivityForm((current) => ({ ...current, response_text: event.target.value }))
                            }
                        />
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setActivityLead(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={saving} leftSection={<MessageSquarePlus size={16} />}>
                                Record Activity
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Drawer>
        </div>
    );
}
