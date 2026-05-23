import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, CalendarCheck, History } from 'lucide-react';

interface ShiftAssignment {
    id: number;
    employee_id: number;
    shift_id: number;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
    shift?: {
        id: number;
        name: string;
        start_time: string;
        end_time: string;
        grace_minutes: number;
        is_active: boolean;
    };
}

interface EmployeeShiftSummaryProps {
    currentShiftAssignment?: ShiftAssignment | null;
    shiftAssignmentHistory?: ShiftAssignment[];
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Open';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatTime(value: string): string {
    const [hours, minutes] = value.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function EmployeeShiftSummary({ currentShiftAssignment, shiftAssignmentHistory = [] }: EmployeeShiftSummaryProps) {
    const hasCurrentShift = Boolean(currentShiftAssignment && currentShiftAssignment.shift);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    Current Shift
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasCurrentShift ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Shift</p>
                                <p className="text-lg font-semibold">{currentShiftAssignment?.shift?.name}</p>
                            </div>
                            <Badge variant="outline" className="px-2 py-1">
                                {currentShiftAssignment?.shift?.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Time window</p>
                                <p className="text-sm">
                                    {formatTime(currentShiftAssignment!.shift!.start_time)} — {formatTime(currentShiftAssignment!.shift!.end_time)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Grace minutes</p>
                                <p className="text-sm">{currentShiftAssignment!.shift!.grace_minutes} min</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Effective from</p>
                                <p className="text-sm">{formatDate(currentShiftAssignment?.effective_from ?? null)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Effective to</p>
                                <p className="text-sm">{formatDate(currentShiftAssignment?.effective_to ?? null)}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            This employee does not have an active shift assignment.
                        </p>
                        <Link href="/admin/shifts" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
                            Manage shifts
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}

                {shiftAssignmentHistory.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <History className="h-4 w-4" />
                            Recent shift assignments
                        </div>
                        <div className="space-y-2">
                            {shiftAssignmentHistory.slice(0, 3).map((assignment) => (
                                <div key={assignment.id} className="rounded-lg border border-slate-200 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-sm">{assignment.shift?.name ?? 'Shift #' + assignment.shift_id}</p>
                                        <Badge variant="secondary" className="px-2 py-1">
                                            {assignment.is_active ? 'Active' : 'Closed'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(assignment.effective_from)} — {formatDate(assignment.effective_to)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
