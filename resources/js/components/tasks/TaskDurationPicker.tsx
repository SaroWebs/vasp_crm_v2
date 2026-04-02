import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface TaskDurationPickerProps {
    value?: string | number | null;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    helperText?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    id?: string;
}

type DurationParts = {
    days: number;
    hours: number;
    minutes: number;
};

const hourOptions = Array.from({ length: 24 }, (_, index) => index);
const minuteOptions = Array.from({ length: 60 }, (_, index) => index);

const parseDurationValue = (value?: string | number | null): DurationParts => {
    if (value === null || value === undefined || value === '') {
        return { days: 0, hours: 0, minutes: 0 };
    }

    const numericValue = typeof value === 'number' ? value : Number.parseFloat(value);

    if (Number.isNaN(numericValue) || numericValue <= 0) {
        return { days: 0, hours: 0, minutes: 0 };
    }

    const totalMinutes = Math.round(numericValue * 60);
    return {
        days: Math.floor(totalMinutes / 1440),
        hours: Math.floor((totalMinutes % 1440) / 60),
        minutes: totalMinutes % 60,
    };
};

const formatDurationLabel = (parts: DurationParts): string => {
    const labels: string[] = [];

    if (parts.days > 0) {
        labels.push(`${parts.days} day${parts.days === 1 ? '' : 's'}`);
    }

    if (parts.hours > 0) {
        labels.push(`${parts.hours} hour${parts.hours === 1 ? '' : 's'}`);
    }

    if (parts.minutes > 0 || labels.length === 0) {
        labels.push(`${parts.minutes} minute${parts.minutes === 1 ? '' : 's'}`);
    }

    return labels.join(' - ');
};

const formatHoursValue = (totalMinutes: number): string => {
    const decimalHours = totalMinutes / 60;
    return decimalHours.toFixed(2).replace(/\.00$/, '');
};

const TaskDurationPicker = ({
    value,
    onChange,
    label = 'Estimated Duration',
    helperText,
    error,
    required = false,
    disabled = false,
    id = 'task-duration',
}: TaskDurationPickerProps) => {
    const parts = useMemo(() => parseDurationValue(value), [value]);

    const totalMinutes = parts.days * 1440 + parts.hours * 60 + parts.minutes;
    const displayValue = totalMinutes > 0 ? formatDurationLabel(parts) : '';

    const updatePart = (nextParts: Partial<DurationParts>) => {
        const merged = {
            ...parts,
            ...nextParts,
        };

        const minutesTotal = merged.days * 1440 + merged.hours * 60 + merged.minutes;
        onChange(minutesTotal > 0 ? formatHoursValue(minutesTotal) : '');
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <Label htmlFor={id}>
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                {!!displayValue && (
                    <X className="mr-2 h-6 w-6 cursor-pointer text-muted-foreground" onClick={() => onChange('')} />
                )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                    <Label htmlFor={`${id}-days`} className="text-xs text-muted-foreground">
                        Days
                    </Label>
                    <Input
                        id={`${id}-days`}
                        type="number"
                        min={0}
                        value={parts.days}
                        onChange={(e) =>
                            updatePart({ days: Math.max(0, Number.parseInt(e.target.value || '0', 10) || 0) })
                        }
                        disabled={disabled}
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`${id}-hours`} className="text-xs text-muted-foreground">
                        Hours
                    </Label>
                    <select
                        id={`${id}-hours`}
                        value={parts.hours}
                        onChange={(e) => updatePart({ hours: Number.parseInt(e.target.value, 10) || 0 })}
                        disabled={disabled}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {hourOptions.map((hour) => (
                            <option key={hour} value={hour}>
                                {hour}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor={`${id}-minutes`} className="text-xs text-muted-foreground">
                        Minutes
                    </Label>
                    <select
                        id={`${id}-minutes`}
                        value={parts.minutes}
                        onChange={(e) => updatePart({ minutes: Number.parseInt(e.target.value, 10) || 0 })}
                        disabled={disabled}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {minuteOptions.map((minute) => (
                            <option key={minute} value={minute}>
                                {minute}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default TaskDurationPicker;
