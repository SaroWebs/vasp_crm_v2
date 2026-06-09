import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type SalesLead } from '@/types/sales-leads';
import {
    Alert,
    Badge,
    Button,
    Card,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Timeline,
    Title,
} from '@mantine/core';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    Building2,
    CalendarCheck,
    CalendarClock,
    CheckCircle2,
    Mail,
    MapPin,
    MessageSquareText,
    Phone,
    Trophy,
    User,
} from 'lucide-react';
import { useState } from 'react';

interface SalesLeadDetailProps {
    lead: SalesLead;
    backUrl: string;
    mode: 'admin' | 'my';
    breadcrumbs: BreadcrumbItem[];
}

function humanize(value?: string | null): string {
    return value ? value.replace(/_/g, ' ') : 'Not set';
}

function titleize(value?: string | null): string {
    return humanize(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export function SalesLeadDetail({
    lead,
    backUrl,
    mode,
    breadcrumbs,
}: SalesLeadDetailProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const completeUrl =
        mode === 'admin'
            ? `/admin/sales-leads/${lead.id}/complete-follow-up`
            : `/my/sales-leads/${lead.id}/complete-follow-up`;
    const closeDealUrl =
        mode === 'admin'
            ? `/admin/sales-leads/${lead.id}/close-deal`
            : `/my/sales-leads/${lead.id}/close-deal`;

    const completeFollowUp = async () => {
        setSaving(true);
        setError(null);

        try {
            await axios.post(completeUrl, {
                response_text: 'Follow-up completed.',
            });
            router.reload();
        } catch {
            setError('Unable to mark follow-up complete.');
        } finally {
            setSaving(false);
        }
    };

    const closeDeal = async () => {
        if (lead.status === 'won' || !window.confirm(`Close ${lead.organization_name} as won?`)) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await axios.post(closeDealUrl, {
                response_text: 'Deal closed as won.',
            });
            router.reload();
        } catch {
            setError('Unable to close deal.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={lead.organization_name} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <Paper withBorder radius="md" p="lg">
                    <Group justify="space-between" align="flex-start" gap="lg">
                        <Stack gap="md">
                            <Button variant="default" size="sm" component={Link} href={backUrl} leftSection={<ArrowLeft size={16} />}>
                                Back to leads
                            </Button>
                            <Stack gap={6}>
                                <Text size="xs" fw={700} tt="uppercase" c="blue">
                                    Sales Lead Detail
                                </Text>
                                <Title order={1} size="h2">
                                    {lead.organization_name}
                                </Title>
                                <Group gap="xs">
                                    <Badge variant="light" color="gray">
                                        {titleize(lead.organization_type)}
                                    </Badge>
                                    <Badge color={interestColor(lead.interest_level)} variant="light">
                                        {titleize(lead.interest_level)}
                                    </Badge>
                                    <Badge color={statusColor(lead.status)} variant="dot">
                                        {titleize(lead.status)}
                                    </Badge>
                                </Group>
                            </Stack>
                        </Stack>

                        <Group gap="sm">
                            <Button
                                onClick={closeDeal}
                                disabled={lead.status === 'won'}
                                loading={saving}
                                color="teal"
                                leftSection={<Trophy size={16} />}
                            >
                                {lead.status === 'won' ? 'Deal Closed' : 'Close as Won'}
                            </Button>
                            <Button
                                onClick={completeFollowUp}
                                disabled={!lead.next_follow_up_at}
                                loading={saving}
                                leftSection={<CheckCircle2 size={16} />}
                            >
                                Complete Follow-up
                            </Button>
                        </Group>
                    </Group>
                </Paper>

                {error ? (
                    <Alert color="red" variant="light">
                        {error}
                    </Alert>
                ) : null}

                <SimpleGrid cols={{ base: 1, xl: 3 }}>
                    <Card withBorder radius="md" padding="lg">
                        <Group gap="sm" mb="md">
                            <ThemeIcon variant="light" color="blue" radius="md">
                                <Building2 size={18} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Title order={3} size="h4">Prospect</Title>
                                <Text size="sm" c="dimmed">Organization and service interest.</Text>
                            </Stack>
                        </Group>
                        <Stack gap="sm">
                            <Text size="sm">Type: {titleize(lead.organization_type)}</Text>
                            <Text size="sm">Service: {lead.product?.name ?? 'Not selected'}</Text>
                            <Text size="sm">Source: {lead.source || 'Not set'}</Text>
                            <Text size="sm">Location: {lead.location || 'Not added'}</Text>
                            <Text size="sm" c="dimmed">{lead.service_notes || 'No service notes recorded.'}</Text>
                        </Stack>
                    </Card>

                    <Card withBorder radius="md" padding="lg">
                        <Group gap="sm" mb="md">
                            <ThemeIcon variant="light" color="teal" radius="md">
                                <User size={18} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Title order={3} size="h4">Contact</Title>
                                <Text size="sm" c="dimmed">Separate from client portal users.</Text>
                            </Stack>
                        </Group>
                        <Stack gap="sm">
                            <Text size="sm" fw={600}>{lead.contact_person_name || 'No contact person'}</Text>
                            <Group gap="xs">
                                <Phone size={16} />
                                <Text size="sm">{lead.contact_phone || 'No phone'}</Text>
                            </Group>
                            <Group gap="xs">
                                <Mail size={16} />
                                <Text size="sm">{lead.contact_email || 'No email'}</Text>
                            </Group>
                            <Group gap="xs">
                                <MapPin size={16} />
                                <Text size="sm">{lead.location || 'No location'}</Text>
                            </Group>
                        </Stack>
                    </Card>

                    <Card withBorder radius="md" padding="lg">
                        <Group gap="sm" mb="md">
                            <ThemeIcon variant="light" color="yellow" radius="md">
                                <CalendarClock size={18} />
                            </ThemeIcon>
                            <Stack gap={0}>
                                <Title order={3} size="h4">Follow-up</Title>
                                <Text size="sm" c="dimmed">Last and next sales actions.</Text>
                            </Stack>
                        </Group>
                        <Stack gap="sm">
                            <Text size="sm">Owner: {lead.owner?.name ?? 'Unassigned'}</Text>
                            <Text size="sm">Last contacted: {formatDate(lead.last_contacted_at)}</Text>
                            <Text size="sm">Next follow-up: {formatDate(lead.next_follow_up_at)}</Text>
                            <Text size="sm" c="dimmed">{lead.latest_response || 'No latest response recorded.'}</Text>
                        </Stack>
                    </Card>
                </SimpleGrid>

                <Card withBorder radius="md" padding="lg">
                    <Group gap="sm" mb="lg">
                        <ThemeIcon variant="light" color="blue" radius="md">
                            <MessageSquareText size={18} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Title order={3}>Activity Timeline</Title>
                            <Text size="sm" c="dimmed">
                                Calls, visits, meetings, messages, emails, and notes recorded for this prospect.
                            </Text>
                        </Stack>
                    </Group>

                    {lead.activities?.length ? (
                        <Timeline active={lead.activities.length} bulletSize={28} lineWidth={2}>
                            {lead.activities.map((activity) => (
                                <Timeline.Item
                                    key={activity.id}
                                    bullet={<CalendarCheck size={14} />}
                                    title={
                                        <Group gap="xs">
                                            <Badge variant="light" color="blue">
                                                {titleize(activity.activity_type)}
                                            </Badge>
                                            {activity.outcome_status ? (
                                                <Badge variant="dot" color={statusColor(activity.outcome_status)}>
                                                    {titleize(activity.outcome_status)}
                                                </Badge>
                                            ) : null}
                                        </Group>
                                    }
                                >
                                    <Text size="sm" mt="xs">
                                        {activity.response_text || 'No response text.'}
                                    </Text>
                                    <Group gap="md" mt="sm">
                                        <Text size="xs" c="dimmed">By: {activity.user?.name ?? 'Unknown'}</Text>
                                        <Text size="xs" c="dimmed">{formatDate(activity.activity_at)}</Text>
                                        <Text size="xs" c="dimmed">
                                            Next follow-up: {formatDate(activity.next_follow_up_at)}
                                        </Text>
                                    </Group>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    ) : (
                        <Paper withBorder radius="md" p="xl" ta="center">
                            <Text size="sm" c="dimmed">No activity has been recorded for this lead yet.</Text>
                        </Paper>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
