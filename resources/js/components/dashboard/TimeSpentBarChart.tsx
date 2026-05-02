import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';

interface TimeSpentPoint {
    label: string;
    date: string;
    hours: number;
}

interface TimeSpentBarChartProps {
    data?: {
        weekly: TimeSpentPoint[];
        monthly: TimeSpentPoint[];
    };
}

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0]?.payload;

    return (
        <div className="rounded-lg border border-border bg-background p-3 text-sm shadow-md">
            <div className="font-medium">{point.label}</div>
            <div className="text-muted-foreground">{point.hours.toFixed(2)} hours</div>
        </div>
    );
}

export default function TimeSpentBarChart({ data }: TimeSpentBarChartProps) {
    const [range, setRange] = useState<'weekly' | 'monthly'>('weekly');
    const [offset, setOffset] = useState(0);

    const buildEmptySeries = (days: number) => {
        const series: TimeSpentPoint[] = [];
        const today = new Date();

        for (let day = days - 1; day >= 0; day -= 1) {
            const date = subDays(today, day);
            series.push({
                label: days === 7 ? format(date, 'EEE') : format(date, 'MMM d'),
                date: format(date, 'yyyy-MM-dd'),
                hours: 0,
            });
        }

        return series;
    };

    const currentSeries = useMemo(() => {
        const baseSeries = data?.[range] ?? [];
        const windowSize = range === 'weekly' ? 7 : 30;

        if (baseSeries.length === 0) {
            return buildEmptySeries(windowSize);
        }

        const sortedSeries = [...baseSeries].sort((a, b) =>
            parseISO(a.date).getTime() - parseISO(b.date).getTime(),
        );

        return sortedSeries;
    }, [data, range]);

    const windowSize = range === 'weekly' ? 7 : 30;
    const maxOffset = Math.max(0, currentSeries.length - windowSize);

    const chartData = useMemo(() => {
        const currentOffset = Math.min(Math.max(offset, 0), maxOffset);
        const start = Math.max(0, currentSeries.length - windowSize - currentOffset);
        const end = currentSeries.length - currentOffset;

        return currentSeries.slice(start, end);
    }, [currentSeries, offset, windowSize, maxOffset]);

    const handleRangeChange = (newRange: 'weekly' | 'monthly') => {
        setRange(newRange);
        setOffset(0);
    };

    const handlePrevious = () => {
        setOffset((previous) => Math.min(previous + windowSize, maxOffset));
    };

    const handleNext = () => {
        setOffset((previous) => Math.max(previous - windowSize, 0));
    };

    const canPrevious = offset < maxOffset;
    const canNext = offset > 0;

    const periodLabel = chartData.length
        ? `${format(parseISO(chartData[0].date), 'MMM d')} - ${format(parseISO(chartData[chartData.length - 1].date), 'MMM d')}`
        : '';

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {range === 'weekly'
                        ? 'Weekly time spent view'
                        : 'Monthly time spent view'}
                    {periodLabel ? ` · ${periodLabel}` : ''}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-muted p-1">
                        <label className={`cursor-pointer rounded-full px-3 py-1 text-sm ${range === 'weekly' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>
                            <input
                                type="radio"
                                name="time-range"
                                className="sr-only"
                                checked={range === 'weekly'}
                                onChange={() => handleRangeChange('weekly')}
                            />
                            Week
                        </label>
                        <label className={`cursor-pointer rounded-full px-3 py-1 text-sm ${range === 'monthly' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}>
                            <input
                                type="radio"
                                name="time-range"
                                className="sr-only"
                                checked={range === 'monthly'}
                                onChange={() => handleRangeChange('monthly')}
                            />
                            Month
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handlePrevious} disabled={!canPrevious}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleNext} disabled={!canNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted p-6 text-center text-sm text-muted-foreground">
                    No time entry data available for this period.
                </div>
            ) : (
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="hours" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
