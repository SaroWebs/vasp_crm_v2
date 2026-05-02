import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';

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
}

export function AttendanceList({ date: initialDate }: AttendanceListProps) {
    const [date, setDate] = useState<Date>(initialDate ?? new Date());
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            setError(null);

            try {
                const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

                // Use the new endpoint to get attendance by specific date
                const endpoint = '/admin/api/attendance/date';

                const response = await axios.get(endpoint, {
                    params: { date: formattedDate },
                });

                if (response.data.status === 'success') {
                    // Set all records directly (no filtering for completed punches)
                    setRecords(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch attendance data.');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch attendance data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [date]);

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
                        {date.toDateString() !== new Date().toDateString() && (
                            <button
                                onClick={handleToday}
                                className="btn btn-sm btn-ghost hover:bg-muted"
                            >
                                Today
                            </button>
                        )}
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
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {records.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No attendance records found for this date
                    </div>
                ) : (
                    <div className="space-y-1">
                        {records.map((record, index) => {
                            return (
                                <div key={record.id || index} className="border-b ">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            <span>{record.employee_name}</span>
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
            </CardContent>
        </Card>
    );
}
