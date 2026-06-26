import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

interface AttendanceRecord {
    id?: number;
    attendance_date: string;
    punch_in: string | null;
    punch_out: string | null;
    mode: string;
    status?: string | null;
}

interface AttendanceOverrideModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId?: number;
    employeeName: string;
    selectedDate?: string;
    existingRecord?: AttendanceRecord | null;
    onSuccess: () => void;
}

export function AttendanceOverrideModal({
    open,
    onOpenChange,
    employeeId,
    employeeName,
    selectedDate,
    existingRecord,
    onSuccess,
}: AttendanceOverrideModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizeTimeInput = (value: string | null | undefined): string => {
        if (!value) {
            return '';
        }

        return value.slice(0, 5);
    };

    const [formData, setFormData] = useState({
        attendance_date:
            selectedDate || existingRecord?.attendance_date || new Date().toISOString().slice(0, 10),
        punch_in: normalizeTimeInput(existingRecord?.punch_in),
        punch_out: normalizeTimeInput(existingRecord?.punch_out),
        mode: existingRecord?.mode || 'office',
        status: existingRecord?.status || 'auto',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const isTimeOptional = ['absent', 'leave', 'holiday'].includes(formData.status);

        try {
            await axios.post(`/api/attendance/${employeeId}/override`, {
                attendance_date: formData.attendance_date,
                punch_in: isTimeOptional ? null : (formData.punch_in || null),
                punch_out: isTimeOptional ? null : (formData.punch_out || null),
                mode: formData.mode,
                status: formData.status === 'auto' ? null : formData.status,
            });

            onSuccess();
            onOpenChange(false);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Failed to save attendance');
        } finally {
            setLoading(false);
        }
    };

    const isTimeOptional = ['absent', 'leave', 'holiday'].includes(formData.status);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {existingRecord ? 'Edit Attendance' : 'Add Attendance'}
                    </DialogTitle>
                    <DialogDescription>
                        Override attendance for {employeeName}
                        {selectedDate && ` on ${selectedDate}`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="attendance_date">Date</Label>
                            <Input
                                id="attendance_date"
                                type="date"
                                value={formData.attendance_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, attendance_date: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status Override</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        status: value,
                                        // clear punch times if status is absent, leave, or holiday
                                        punch_in: ['absent', 'leave', 'holiday'].includes(value) ? '' : formData.punch_in,
                                        punch_out: ['absent', 'leave', 'holiday'].includes(value) ? '' : formData.punch_out,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status override" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto (Calculated)</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="leave">Leave</SelectItem>
                                    <SelectItem value="holiday">Holiday</SelectItem>
                                    <SelectItem value="half_day">Half Day</SelectItem>
                                    <SelectItem value="field_work">Field Work</SelectItem>
                                    <SelectItem value="remote_work">Remote Work</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {!isTimeOptional && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="punch_in">Punch In Time</Label>
                                    <Input
                                        id="punch_in"
                                        type="time"
                                        value={formData.punch_in}
                                        onChange={(e) =>
                                            setFormData({ ...formData, punch_in: e.target.value })
                                        }
                                        required={!isTimeOptional}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="punch_out">Punch Out Time (optional)</Label>
                                    <Input
                                        id="punch_out"
                                        type="time"
                                        value={formData.punch_out}
                                        onChange={(e) =>
                                            setFormData({ ...formData, punch_out: e.target.value })
                                        }
                                    />
                                </div>
                            </>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="mode">Mode</Label>
                            <Select
                                value={formData.mode}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, mode: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="office">Office</SelectItem>
                                    <SelectItem value="remote">Remote</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
