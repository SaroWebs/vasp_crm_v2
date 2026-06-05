import { Card, Group, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';

interface StatsBarProps {
    totalAssigned: number;
    totalConsumed: number;
    totalRemaining: number;
    totalEmployees: number;
    avgUtilization: number;
}

export function StatsBar({
    totalAssigned,
    totalConsumed,
    totalRemaining,
    totalEmployees,
    avgUtilization,
}: StatsBarProps) {
    const stats = [
        {
            label: 'Total Assigned',
            value: totalAssigned,
            suffix: 'days',
            icon: <Calendar size={18} />,
            color: 'blue',
            accent: '#3b82f6',
            bg: '#eff6ff',
        },
        {
            label: 'Days Used',
            value: totalConsumed,
            suffix: 'days',
            icon: <Clock size={18} />,
            color: 'orange',
            accent: '#f97316',
            bg: '#fff7ed',
        },
        {
            label: 'Remaining',
            value: Number(totalRemaining).toFixed(1),
            suffix: 'days',
            icon: <TrendingUp size={18} />,
            color: 'teal',
            accent: '#14b8a6',
            bg: '#f0fdfa',
        },
        {
            label: 'Avg Utilization',
            value: `${Number(avgUtilization).toFixed(0)}%`,
            suffix: `across ${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''}`,
            icon: <Users size={18} />,
            color: 'violet',
            accent: '#8b5cf6',
            bg: '#f5f3ff',
        },
    ];

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
            {stats.map((stat) => (
                <Card
                    key={stat.label}
                    withBorder
                    radius="md"
                    p="md"
                    style={{
                        background: stat.bg,
                        borderColor: `${stat.accent}25`,
                    }}
                >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                            <Text
                                size="xs"
                                fw={700}
                                tt="uppercase"
                                style={{ letterSpacing: '0.06em', color: stat.accent, opacity: 0.8 }}
                                mb={4}
                            >
                                {stat.label}
                            </Text>
                            <Text
                                fw={800}
                                size="xl"
                                style={{ letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1 }}
                            >
                                {stat.value}
                            </Text>
                            <Text size="xs" c="dimmed" mt={2}>
                                {stat.suffix}
                            </Text>
                        </div>
                        <ThemeIcon
                            size="lg"
                            radius="md"
                            variant="light"
                            color={stat.color}
                            style={{ background: `${stat.accent}20`, flexShrink: 0 }}
                        >
                            {stat.icon}
                        </ThemeIcon>
                    </Group>
                </Card>
            ))}
        </SimpleGrid>
    );
}
