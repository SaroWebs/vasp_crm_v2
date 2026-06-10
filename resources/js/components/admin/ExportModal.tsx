import {
    Button,
    Group,
    Modal,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { format, subDays } from 'date-fns';
import {
    CalendarDays,
    Columns3,
    Download,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useState } from 'react';

export interface ExportColumn {
    key: string;
    label: string;
}

export interface ExportFilterConfig {
    key: string;
    label: string;
    type: 'select' | 'text' | 'date';
    options?: { value: string; label: string }[];
}

export interface ExportConfig {
    startDate: string;
    endDate: string;
    columns: string[];
    filters: Record<string, string>;
    statuses: string[];
}

interface ExportModalProps {
    opened: boolean;
    onClose: () => void;
    onExport: (config: ExportConfig) => void;
    title: string;
    availableColumns: ExportColumn[];
    defaultColumns?: string[];
    filterConfigs?: ExportFilterConfig[];
    initialFilters?: Record<string, string>;
    statusOptions?: { value: string; label: string }[];
    initialStatuses?: string[];
    statusLabel?: string;
    isExporting?: boolean;
}

// Pill toggle chip — replaces checkboxes for a tactile feel
function TogglePill({
    label,
    active,
    onClick,
    color = 'blue',
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    color?: string;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 12px',
                borderRadius: 20,
                border: active
                    ? `1.5px solid var(--mantine-color-${color}-6)`
                    : '1.5px solid var(--mantine-color-gray-3)',
                background: active
                    ? `var(--mantine-color-${color}-0)`
                    : 'transparent',
                color: active
                    ? `var(--mantine-color-${color}-7)`
                    : 'var(--mantine-color-gray-6)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
                userSelect: 'none',
            }}
        >
            {active && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                        d="M1.5 5L4 7.5L8.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
            {label}
        </button>
    );
}

function SectionLabel({
    icon: Icon,
    children,
}: {
    icon: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <Group gap={6} mb="xs">
            <Icon size={14} style={{ color: 'var(--mantine-color-gray-5)' }} />
            <Text
                size="xs"
                tt="uppercase"
                fw={600}
                c="dimmed"
                style={{ letterSpacing: '0.06em' }}
            >
                {children}
            </Text>
        </Group>
    );
}

export default function ExportModal({
    opened,
    onClose,
    onExport,
    title,
    availableColumns,
    defaultColumns = [],
    filterConfigs = [],
    initialFilters = {},
    statusOptions = [],
    initialStatuses = [],
    statusLabel = 'Ticket statuses',
    isExporting = false,
}: ExportModalProps) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const defaultStartDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(today);
    const [selectedColumns, setSelectedColumns] =
        useState<string[]>(defaultColumns);
    const [filterValues, setFilterValues] =
        useState<Record<string, string>>(initialFilters);
    const [selectedStatuses, setSelectedStatuses] =
        useState<string[]>(initialStatuses);

    const handleColumnToggle = (key: string) => {
        setSelectedColumns((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
    };

    const handleStatusToggle = (value: string) => {
        setSelectedStatuses((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value],
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
        if (
            !startDate ||
            !endDate ||
            startDate > endDate ||
            selectedColumns.length === 0
        )
            return;
        if (statusOptions.length > 0 && selectedStatuses.length === 0) return;
        onExport({
            startDate,
            endDate,
            columns: selectedColumns,
            filters: filterValues,
            statuses: selectedStatuses,
        });
    };

    const handleClose = () => {
        setStartDate(defaultStartDate);
        setEndDate(today);
        setSelectedColumns(defaultColumns);
        setFilterValues(initialFilters);
        setSelectedStatuses(initialStatuses);
        onClose();
    };

    const isValid =
        !!startDate &&
        !!endDate &&
        startDate <= endDate &&
        selectedColumns.length > 0 &&
        (statusOptions.length === 0 || selectedStatuses.length > 0);

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Stack gap={2}>
                    <Text
                        size="xs"
                        tt="uppercase"
                        fw={600}
                        c="dimmed"
                        style={{ letterSpacing: '0.07em' }}
                    >
                        Export CSV
                    </Text>
                    <Text size="md" fw={600}>
                        {title}
                    </Text>
                </Stack>
            }
            size="xl"
            centered
            styles={{
                header: {
                    paddingBottom: 'var(--mantine-spacing-xs)',
                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                },
                body: { padding: 0 },
            }}
        >
            {/* Two-column layout: left = config, right = columns */}
            <div style={{ display: 'flex', minHeight: 360 }}>
                {/* LEFT: Date range, filters, statuses */}
                <div
                    style={{
                        flex: '0 0 52%',
                        padding: '20px 24px',
                        borderRight: '1px solid var(--mantine-color-gray-2)',
                    }}
                >
                    <Stack gap="lg">
                        {/* Date range */}
                        <div>
                            <SectionLabel icon={CalendarDays}>
                                Date range
                            </SectionLabel>
                            <SimpleGrid cols={2} spacing="sm">
                                <TextInput
                                    label="From"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.currentTarget.value)
                                    }
                                    required
                                    size="sm"
                                />
                                <TextInput
                                    label="To"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) =>
                                        setEndDate(e.currentTarget.value)
                                    }
                                    required
                                    size="sm"
                                />
                            </SimpleGrid>
                        </div>

                        {/* Dynamic filters */}
                        {filterConfigs.length > 0 && (
                            <div>
                                <SectionLabel icon={SlidersHorizontal}>
                                    Filters
                                </SectionLabel>
                                <Stack gap="sm">
                                    {filterConfigs.map((config) => (
                                        <Select
                                            key={config.key}
                                            label={config.label}
                                            data={config.options ?? []}
                                            value={
                                                filterValues[config.key] || ''
                                            }
                                            onChange={(value) =>
                                                handleFilterChange(
                                                    config.key,
                                                    value || '',
                                                )
                                            }
                                            clearable
                                            searchable={
                                                config.type === 'select'
                                            }
                                            size="sm"
                                        />
                                    ))}
                                </Stack>
                            </div>
                        )}

                        {/* Status toggles */}
                        {statusOptions.length > 0 && (
                            <div>
                                <Group justify="space-between" mb="xs">
                                    <SectionLabel icon={SlidersHorizontal}>
                                        {statusLabel}
                                    </SectionLabel>
                                    {selectedStatuses.length === 0 && (
                                        <Text size="xs" c="red.5">
                                            At least one required
                                        </Text>
                                    )}
                                </Group>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 8,
                                    }}
                                >
                                    {statusOptions.map((status) => (
                                        <TogglePill
                                            key={status.value}
                                            label={status.label}
                                            active={selectedStatuses.includes(
                                                status.value,
                                            )}
                                            onClick={() =>
                                                handleStatusToggle(status.value)
                                            }
                                            color="violet"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Stack>
                </div>

                {/* RIGHT: Column picker */}
                <div
                    style={{
                        flex: 1,
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Group justify="space-between" mb="xs">
                        <SectionLabel icon={Columns3}>Columns</SectionLabel>
                        <Group gap={6}>
                            <Text size="xs" c="dimmed">
                                {selectedColumns.length} /{' '}
                                {availableColumns.length}
                            </Text>
                            <button
                                onClick={() =>
                                    selectedColumns.length ===
                                    availableColumns.length
                                        ? setSelectedColumns([])
                                        : setSelectedColumns(
                                              availableColumns.map(
                                                  (c) => c.key,
                                              ),
                                          )
                                }
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--mantine-color-blue-6)',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                    fontWeight: 500,
                                }}
                            >
                                {selectedColumns.length ===
                                availableColumns.length
                                    ? 'Clear all'
                                    : 'Select all'}
                            </button>
                        </Group>
                    </Group>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            alignContent: 'flex-start',
                            flex: 1,
                        }}
                    >
                        {availableColumns.map((column) => (
                            <TogglePill
                                key={column.key}
                                label={column.label}
                                active={selectedColumns.includes(column.key)}
                                onClick={() => handleColumnToggle(column.key)}
                                color="blue"
                            />
                        ))}
                    </div>

                    {selectedColumns.length === 0 && (
                        <Text size="xs" c="red.5" mt="xs">
                            Select at least one column
                        </Text>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    padding: '14px 24px',
                    borderTop: '1px solid var(--mantine-color-gray-2)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    background: 'var(--mantine-color-gray-0)',
                }}
            >
                <Button
                    variant="default"
                    onClick={handleClose}
                    leftSection={<X size={14} />}
                    size="sm"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    loading={isExporting}
                    disabled={!isValid}
                    leftSection={<Download size={14} />}
                    size="sm"
                >
                    Export CSV
                </Button>
            </div>
        </Modal>
    );
}
