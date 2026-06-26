import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarRange } from 'lucide-react';

export interface OpMonth {
    label: string;
    start_date: string;  // 'YYYY-MM-DD'
    end_date: string;    // 'YYYY-MM-DD'
    rule_id: number | null;
    is_first_cycle: boolean;
    has_gap_prefix: boolean;
}

interface OpMonthSelectorProps {
    opMonths: OpMonth[];
    selected: OpMonth | null;
    onChange: (opMonth: OpMonth) => void;
    loading?: boolean;
}

export function OpMonthSelector({ opMonths, selected, onChange, loading }: OpMonthSelectorProps) {
    const selectedKey = selected ? `${selected.start_date}|${selected.end_date}` : '';

    return (
        <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <CalendarRange className="h-4 w-4 text-primary" />
            </div>
            <Select
                value={selectedKey}
                onValueChange={(val) => {
                    const found = opMonths.find(om => `${om.start_date}|${om.end_date}` === val);
                    if (found) onChange(found);
                }}
                disabled={loading || opMonths.length === 0}
            >
                <SelectTrigger className="h-8 min-w-[240px] text-sm">
                    <SelectValue placeholder="Select op month..." />
                </SelectTrigger>
                <SelectContent>
                    {opMonths.map((om) => (
                        <SelectItem key={`${om.start_date}|${om.end_date}`} value={`${om.start_date}|${om.end_date}`}>
                            <span className="flex items-center gap-2">
                                <span>{om.label}</span>
                                {om.has_gap_prefix && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0">gap incl.</Badge>
                                )}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

