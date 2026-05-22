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
    punch_in: string | null;
    punch_out: string | null;
    breaks: BreakSlot[];
    total_break_minutes: number;
    total_work_minutes: number | null;
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

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}


// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="border-b border-gray-100 dark:border-gray-800">
            {Array.from({ length: 7 }).map((_, i) => (
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
    const [loading, setLoading] = useState(false);

    const handleDateChange = async (newDate: string | Date, offsetDays = 0) => {
        const date = dayjs(newDate).add(offsetDays, 'day');
        const formattedDate = date.format('YYYY-MM-DD');

        setSelectedDate(formattedDate);
        setLoading(true);

        axios.get(`/api/daily/attendance?date=${formattedDate}`).then(res => {
            setData(res.data?.records);
        }).catch(err => {
            console.error("Error fetching attendance data:", err);
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        handleDateChange(selectedDate);
    }, []);


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
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[100px]">Punch in</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[100px]">Punch out</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 min-w-[200px]">Breaks</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 w-[100px]">Work hrs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
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
                                                        let label = `${fmtTime(b.break_out)} - ${fmtTime(b.break_in)}`;
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