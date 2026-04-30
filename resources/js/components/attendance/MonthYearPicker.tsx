import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ActionIcon, Text, Group } from '@mantine/core';

interface MonthYearPickerProps {
    month: number;
    year: number;
    onChange: (month: number, year: number) => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthYearPicker({ month, year, onChange }: MonthYearPickerProps) {
    const handlePrevMonth = () => {
        if (month === 1) onChange(12, year - 1);
        else onChange(month - 1, year);
    };

    const handleNextMonth = () => {
        if (month === 12) onChange(1, year + 1);
        else onChange(month + 1, year);
    };

    return (
        <Group gap="xs" className='border rounded'>
            <ActionIcon variant="subtle" color="gray" onClick={handlePrevMonth}>
                <ChevronLeft size={16} />
            </ActionIcon>

            <Text fw={500} size="sm" w={120} ta="center">
                {MONTHS[month - 1]} {year}
            </Text>

            <ActionIcon variant="subtle" color="gray" onClick={handleNextMonth}>
                <ChevronRight size={16} />
            </ActionIcon>
        </Group>
    );
}