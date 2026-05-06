import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

interface TimeSpentPoint {
    label: string;
    date: string;
    hours: number;
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

export default function TimeSpentBarChart() {
    const [range, setRange] = useState<'weekly' | 'monthly'>('weekly');
    const [offset, setOffset] = useState(0);
    const [chartData, setChartData] = useState<TimeSpentPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`/admin/api/dashboard/chart-data?range=${range}&offset=${offset}`)
            .then(res => {
                setChartData(res.data.chartData || []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [range, offset]);

    const handleRangeChange = (newRange: 'weekly' | 'monthly') => {
        setRange(newRange);
        setOffset(0);
    };

    const handlePrevious = () => {
        setOffset((prev) => prev + 1);
    };

    const handleNext = () => {
        setOffset((prev) => Math.max(0, prev - 1));
    };

    const canNext = offset > 0;

    const periodLabel = useMemo(() => {
        if (!chartData.length) return '';
        return `${format(parseISO(chartData[0].date), 'MMM d')} - ${format(parseISO(chartData[chartData.length - 1].date), 'MMM d')}`;
    }, [chartData]);

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
                        <Button size="sm" variant="outline" onClick={handlePrevious}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleNext} disabled={!canNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative h-[320px]">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {chartData.length === 0 && !loading ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                        No time entry data available for this period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="hours" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
