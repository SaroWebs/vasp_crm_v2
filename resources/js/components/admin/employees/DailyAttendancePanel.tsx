import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, Button, Input, Avatar } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import axios from 'axios';

export interface BreakSlot {
    break_out: string;
    break_in: string;
    duration_minutes: number;
}

export interface AttendanceRecord {
    employee_id: string | number;
    employee_name: string;
    status?: string;
    shift_id: number | null;
    shift_start: string | null;
    shift_end: string | null;
    shift_grace_minutes: number;
    punch_in: string | null;
    punch_out: string | null;
    breaks: BreakSlot[];
    total_break_minutes: number;
    total_work_minutes: number | null;
    early_in_minutes: number;
    late_in_minutes: number;
    early_out_minutes: number;
    late_out_minutes: number;
    is_early_in: boolean;
    is_late_in: boolean;
    is_early_out: boolean;
    is_late_out: boolean;
    overtime_minutes: number;
    office: string;
}

export interface DailyAttendancePanelProps {
    date: string;
    data: AttendanceRecord[];
    handleDateChange?: (date: string) => void;
    loading?: boolean;
    standardWorkMinutes?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(datetimeStr: string): string {
    const d = new Date(datetimeStr.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) {
        return '—';
    }

    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}


// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="border-b border-gray-100 dark:border-gray-800">
            {Array.from({ length: 9 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </td>
            ))}
        </tr>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DailyAttendancePanel() {

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const handleDateChange = (newDate: string | Date, offsetDays = 0) => {
        const date = dayjs(newDate).add(offsetDays, 'day');
        const formattedDate = date.format('YYYY-MM-DD');
        setLoading(true);
        setSelectedDate(formattedDate);
    };

    useEffect(() => {
        axios.get(`/api/daily/attendance?date=${selectedDate}`).then(res => {
            setData(res.data?.records);
        }).catch(err => {
            console.error("Error fetching attendance data:", err);
        }).finally(() => {
            setLoading(false);
        });
    }, [selectedDate]);


    const [search, setSearch] = useState('');


    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return data.filter((r) => {
            if (!r) return false;
            if (
                q &&
                !r.employee_name.toLowerCase().includes(q) &&
                !String(r.employee_id).toLowerCase().includes(q) &&
                !r.office.toLowerCase().includes(q)
            ) return false;
            return true;
        });
    }, [data, search]);


    const displayDate = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : '';

    return (
        <div className="font-sans border rounded-lg p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        Daily attendance
                    </h2>
                    {displayDate && (
                        <p className="text-xs text-gray-400 mt-0.5 ml-6">{displayDate}</p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Input
                        type="text"
                        placeholder="Employee, ID, or office..."
                        leftSection={<Search size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {handleDateChange && (
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleDateChange(selectedDate, -1)}
                                title="Previous day"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <DateInput
                                value={dayjs(selectedDate).toDate()}
                                onChange={(date) => {
                                    if (date) {
                                        handleDateChange(date);
                                    }
                                }}
                                placeholder="Select date"
                                size="sm"
                                clearable={false}
                                className="w-40"
                            />
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleDateChange(selectedDate, 1)}
                                title="Next day"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm border-collapse table-fixed">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 min-w-[200px]">Employee</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[110px]">Office</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[170px]">Shift / Late-Early</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[100px]">Punch in</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[100px]">Punch out</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 min-w-[200px]">Breaks</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[100px]">Work hrs</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[110px]">Overtime</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-10 text-sm text-gray-400">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((record) => {

                                return (
                                    <tr
                                        key={record.employee_id}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        {/* Employee */}
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <Avatar name={record.employee_name} color="initials" />
                                                
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                                                        {record.employee_name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">
                                                        {record.employee_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Office */}
                                        <td className="px-4 py-2.5">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                {record.office || 'N/A'}
                                            </span>
                                        </td>

                                        {/* Shift + Late/Early */}
                                        <td className="px-4 py-2.5">
                                            <div className="space-y-1 text-[11px]">
                                                <div className="text-gray-700 dark:text-gray-300">
                                                    {record.shift_start && record.shift_end ? (
                                                        <>
                                                            {record.shift_start.slice(0, 5)}-{record.shift_end.slice(0, 5)}
                                                            {' '}
                                                            {record.shift_grace_minutes > 0 && (
                                                                <span className="text-gray-400">(±:{record.shift_grace_minutes}m)</span>
                                                            )}
                                                            
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">No shift</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {record.is_early_in && record.early_in_minutes > 0 && (
                                                        <span className="rounded border border-blue-500 px-1 text-blue-700">
                                                            Early in {record.early_in_minutes.toFixed(1)}m
                                                        </span>
                                                    )}
                                                    {record.is_late_in && record.late_in_minutes > 0 && (
                                                        <span className="rounded border border-yellow-500 px-1 text-yellow-700">
                                                            Late in {record.late_in_minutes.toFixed(1)}m
                                                        </span>
                                                    )}
                                                    {record.is_early_out && record.early_out_minutes > 0 && (
                                                        <span className="rounded border border-orange-500 px-1 text-orange-700">
                                                            Early out {record.early_out_minutes.toFixed(1)}m
                                                        </span>
                                                    )}
                                                    {record.is_late_out && record.late_out_minutes > 0 && (
                                                        <span className="rounded border border-green-500 px-1 text-green-700">
                                                            Late out {record.late_out_minutes.toFixed(1)}m
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>


                                        {/* Punch in */}
                                        <td className="px-4 py-2.5">
                                            {record.punch_in ? (
                                                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                                                    {fmtTime(record.punch_in)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>

                                        {/* Punch out */}
                                        <td className="px-4 py-2.5">
                                            {record.punch_out ? (
                                                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                                                    {fmtTime(record.punch_out)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>

                                        {/* Breaks */}
                                        <td className="px-4 py-2.5">
                                            {record.breaks.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {record.breaks.map((b, i) => {
                                                        if (b.duration_minutes < 1) return null;
                                                        const label = `${fmtTime(b.break_out)} - ${fmtTime(b.break_in)}`;
                                                        return (
                                                            <Tooltip key={i} className={`text-[8px] font-mono p-1/2`} label={label} color="red">
                                                                <span className="text-[11px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
                                                                    {toHours(b.duration_minutes)}
                                                                </span>
                                                            </Tooltip>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                                            )}
                                        </td>

                                        {/* Work hours bar */}
                                        <td className="px-4 py-2.5">
                                            <span>{toHours(record.total_work_minutes)}</span>
                                        </td>

                                        {/* Overtime */}
                                        <td className="px-4 py-2.5">
                                            <span className={record.overtime_minutes > 0 ? 'font-medium text-green-700 dark:text-green-400' : 'text-gray-400'}>
                                                {toHours(record.overtime_minutes)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


function toHours(minutes: number | null): string {
    if (minutes === null) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}
