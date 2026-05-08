import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { Text } from '@mantine/core';

interface AttendanceRecord {
    id?: number;
    employee_id?: number;
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    employee_name?: string;
    mode: string;
    ip?: string;
}

interface AttendanceListProps {
    date?: Date; // Made optional so we can manage internal state
    type?: 'employee' | 'admin';
    employeeId?: number | string;
    hasFilter?: boolean;
    hasPagination?: boolean;
    showRecentOnly?: boolean; // only past 7 days
}

function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function isWithinLastDays(attendanceDate: string, days: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const boundary = new Date(today);
    boundary.setDate(boundary.getDate() - (days - 1));

    const parsed = new Date(`${attendanceDate}T00:00:00`);

    return parsed >= boundary && parsed <= today;
}

export function AttendanceList({
    date: initialDate,
    type = 'admin',
    employeeId,
    hasFilter = false,
    hasPagination = false,
    showRecentOnly = false,
}: AttendanceListProps) {
    const [date, setDate] = useState<Date>(initialDate ?? new Date());
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);

    const pageSize = 10;

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            setError(null);

            try {
                if (type === 'admin' || !employeeId) {
                    const endpoint = '/admin/api/attendance/date';
                    const response = await axios.get(endpoint, {
                        params: { date: formatDateForApi(date) },
                    });

                    if (response.data.status === 'success') {
                        setRecords(response.data.data);
                    } else {
                        setError(response.data.message || 'Failed to fetch attendance data.');
                    }

                    return;
                }

                if (showRecentOnly) {
                    const today = new Date();
                    const monthsToFetch = new Map<string, { month: number; year: number }>();

                    for (let offset = 0; offset < 7; offset++) {
                        const cursor = new Date(today);
                        cursor.setDate(cursor.getDate() - offset);
                        monthsToFetch.set(`${cursor.getFullYear()}-${cursor.getMonth() + 1}`, {
                            year: cursor.getFullYear(),
                            month: cursor.getMonth() + 1,
                        });
                    }

                    const responses = await Promise.all(
                        [...monthsToFetch.values()].map(({ month, year }) =>
                            axios.get(`/api/attendance/${employeeId}`, {
                                params: { month, year },
                            })
                        )
                    );

                    const allRecords = responses.flatMap((response) =>
                        response.data.status === 'success' ? response.data.data : []
                    ) as AttendanceRecord[];

                    setRecords(
                        allRecords
                            .filter((record) => isWithinLastDays(record.attendance_date, 7))
                            .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
                    );

                    return;
                }

                const response = await axios.get(`/api/attendance/${employeeId}`, {
                    params: { month: date.getMonth() + 1, year: date.getFullYear() },
                });

                if (response.data.status === 'success') {
                    setRecords(
                        (response.data.data as AttendanceRecord[]).filter(
                            (record) => record.attendance_date === formatDateForApi(date)
                        )
                    );
                } else {
                    setError(response.data.message || 'Failed to fetch attendance data.');
                }
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError((err.response?.data as { message?: string } | undefined)?.message || 'Failed to fetch attendance data.');
                } else {
                    setError('Failed to fetch attendance data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [date, employeeId, showRecentOnly, type]);

    useEffect(() => {
        setPage(1);
    }, [date, filter, records.length, showRecentOnly, type]);

    const formatTime = (time: string | null) => {
        if (!time) return '—';
        const [h, m] = time.split(':');
        const dateObj = new Date();
        dateObj.setHours(Number(h), Number(m));
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleToday = () => {
        setDate(new Date());
    };

    const handlePreviousDay = () => {
        setDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
    };

    const handleNextDay = () => {
        setDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
    };

    const filteredRecords = useMemo(() => {
        const trimmed = filter.trim().toLowerCase();

        if (!trimmed) {
            return records;
        }

        return records.filter((record) => {
            const haystack = [
                record.employee_name,
                record.attendance_date,
                record.mode,
                record.ip,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(trimmed);
        });
    }, [filter, records]);

    const paginatedRecords = useMemo(() => {
        if (!hasPagination) {
            return filteredRecords;
        }

        const start = (page - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, hasPagination, page, pageSize]);

    const lastPage = useMemo(() => {
        if (!hasPagination) {
            return 1;
        }

        return Math.max(1, Math.ceil(filteredRecords.length / pageSize));
    }, [filteredRecords.length, hasPagination, pageSize]);

    useEffect(() => {
        if (page > lastPage) {
            setPage(lastPage);
        }
    }, [lastPage, page]);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-red-600 text-sm">{error}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <span className="text-sm">Attendance Records</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!showRecentOnly && date.toDateString() !== new Date().toDateString() && (
                            <button
                                onClick={handleToday}
                                className="btn btn-sm btn-ghost hover:bg-muted"
                            >
                                Today
                            </button>
                        )}
                        {!showRecentOnly ? (
                            <>
                                <button
                                    onClick={handlePreviousDay}
                                    className="btn btn-sm btn-ghost hover:bg-muted"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="font-medium">{format(date, 'MMM dd, yyyy')}</span>
                                <button
                                    onClick={handleNextDay}
                                    className="btn btn-sm btn-ghost hover:bg-muted"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <span className="font-medium">Last 7 days</span>
                        )}
                    </div>
                </div>
                {(hasFilter && records.length > 0) && (
                    <div className="mt-3">
                        <input
                            value={filter}
                            onChange={(event) => setFilter(event.target.value)}
                            placeholder="Filter by name, date, mode…"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {filteredRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No attendance records found
                    </div>
                ) : (
                    <div className="space-y-1">
                        {paginatedRecords.map((record, index) => {
                            return (
                                <div key={record.id || index} className="border-b ">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            <Text className='font-mono text-xs'>{record.employee_name ?? `Employee #${record.employee_id ?? ''}`}</Text>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <span className=" min-w-[50px] font-medium text-xs text-green-600">
                                                    {formatTime(record.punch_in)}
                                                </span>
                                                {'-'}
                                                <span className=" min-w-[50px] font-medium text-xs text-red-600">
                                                    {record.punch_out ? formatTime(record.punch_out) : (<span className='italic text-gray-300'>Not Punched</span>)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 rounded border px-1">
                                                {record.mode === 'remote' ? 'Remote' : 'Office'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasPagination && filteredRecords.length > pageSize && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="btn btn-sm btn-ghost hover:bg-muted"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Previous
                            </button>
                            <span className="text-xs text-muted-foreground px-2">
                                Page {page} of {lastPage}
                            </span>
                            <button
                                className="btn btn-sm btn-ghost hover:bg-muted"
                                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                disabled={page >= lastPage}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
