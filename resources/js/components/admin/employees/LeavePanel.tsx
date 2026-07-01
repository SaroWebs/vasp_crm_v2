import { Link } from '@inertiajs/react';
import { useState, useEffect, useCallback, useId } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    CheckCircle2, XCircle, Clock, AlertCircle,
    CalendarDays, TrendingUp, Ban, MapPin, Laptop, Plus,
    Edit2, Trash2, ChevronDown, ChevronUp, Loader2, ExternalLink, CalendarClock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveType {
    id: number;
    name: string;
    duration_type: 'full_day' | 'half_day' | 'custom_hours' | 'hourly';
    is_paid: boolean;
    requires_approval: boolean;
    default_hours?: number | null;
    is_active?: boolean;
}

interface LeaveBalance {
    id: number;
    leave_type_id: number;
    leave_type?: LeaveType;
    year: number;
    opening_leaves: number;
    assigned_leaves: number;
    consumed_leaves: number;
    remaining_leaves: number;
}

interface LeaveRequest {
    id: number;
    leave_type_id: number;
    leave_type?: LeaveType;
    start_date: string;
    end_date: string;
    reason?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    created_at: string;
    approval?: {
        decision: 'approved' | 'rejected';
        notes?: string | null;
        approved_by_user?: { name: string } | null;
    } | null;
}

interface RemoteWorkRequest {
    id: number;
    start_date: string;
    end_date: string;
    reason?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approval_notes?: string | null;
    approved_by_user?: { name: string } | null;
    created_at: string;
}

interface RemoteWorkAssignment {
    id: number;
    start_date: string;
    end_date: string;
    notes?: string | null;
    assigned_by_user?: { name: string } | null;
}

interface FieldWorkAssignment {
    id: number;
    start_date: string;
    end_date: string;
    location: string;
    description?: string | null;
    custom_start_time?: string | null;
    custom_end_time?: string | null;
    notes?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    assigned_by_user?: { name: string } | null;
    approval_notes?: string | null;
    approved_by_user?: { name: string } | null;
}

interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

interface ShiftAssignment {
    id: number;
    employee_id: number;
    shift_id: number;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
    shift?: Shift;
}

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type PanelView = 'leaves' | 'remote' | 'field' | 'shift';

interface LeavePanelProps {
    employeeId: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const STATUS_CONFIG: Record<RequestStatus, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    pill: string;
}> = {
    pending: { label: 'Pending', icon: Clock, pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
    approved: { label: 'Approved', icon: CheckCircle2, pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    rejected: { label: 'Rejected', icon: XCircle, pill: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
    cancelled: { label: 'Cancelled', icon: Ban, pill: 'bg-muted/60 text-muted-foreground border-border' },
};

function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function days(s: string, e: string) {
    return Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000) + 1;
}
function unpack<T>(res: unknown): T[] {
    if (!res || typeof res !== 'object') return [];
    const r = res as Record<string, unknown>;
    if (Array.isArray(r)) return r as unknown as T[];
    if (Array.isArray(r.data)) return r.data as T[];
    if (Array.isArray(r.leave_balances)) return r.leave_balances as T[];
    if (Array.isArray(r.leave_requests)) return r.leave_requests as T[];
    if (Array.isArray(r.remote_work_assignments)) return r.remote_work_assignments as T[];
    if (Array.isArray(r.field_work_assignments)) return r.field_work_assignments as T[];
    if (Array.isArray(r.field_work_requests)) return r.field_work_requests as T[];
    return [];
}
function apiErr(e: unknown): string {
    if (!axios.isAxiosError(e)) return 'Unexpected error.';
    const d = e.response?.data;
    return d?.message ?? d?.error ?? e.message ?? 'Request failed.';
}

function isShiftAssignmentActive(assignment: ShiftAssignment): boolean {
    const today = new Date().toISOString().slice(0, 10);

    return assignment.is_active && (!assignment.effective_to || assignment.effective_to >= today);
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function Skeleton({ rows = 3, h = 'h-16' }: { rows?: number; h?: string }) {
    return <div className="space-y-2">{Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${h} animate-pulse rounded-lg border bg-muted/30`} />
    ))}</div>;
}

function Empty({ icon: Icon, msg }: { icon: React.ComponentType<{ className?: string }>; msg: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Icon className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
    );
}

function SectionErr({ msg, onRetry }: { msg: string; onRetry: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800 dark:bg-red-950/30">
            <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{msg}
            </div>
            <button type="button" onClick={onRetry} className="shrink-0 text-xs text-red-600 underline hover:no-underline dark:text-red-400">
                Retry
            </button>
        </div>
    );
}

function StatusBadge({ status }: { status: RequestStatus }) {
    const { label, icon: Icon, pill } = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pill}`}>
            <Icon className="h-2.5 w-2.5" />{label}
        </span>
    );
}

function SectionHead({
    icon: Icon, title, action,
}: { icon: React.ComponentType<{ className?: string }>; title: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
            </div>
            {action}
        </div>
    );
}

function FilterPills({ value, onChange, pendingCount }: {
    value: RequestStatus | 'all';
    onChange: (v: RequestStatus | 'all') => void;
    pendingCount: number;
}) {
    const opts: (RequestStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected'];
    return (
        <div className="flex flex-wrap gap-1">
            {opts.map((o) => (
                <button key={o} type="button" onClick={() => onChange(o)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize transition-colors
                        ${value === o ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                    {o}
                    {o === 'pending' && pendingCount > 0 && (
                        <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                            {pendingCount}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

// ─── Approve / Reject inline action row ──────────────────────────────────────

function ApproveRejectRow({ onApprove, onReject, loading }: {
    onApprove: () => void;
    onReject: (notes: string) => void;
    loading: boolean;
}) {
    const [rejecting, setRejecting] = useState(false);
    const [notes, setNotes] = useState('');

    if (rejecting) return (
        <div className="flex flex-col gap-1.5 rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/20">
            <Textarea
                placeholder="Rejection reason (optional)"
                className="min-h-[52px] resize-none text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
            />
            <div className="flex gap-1.5">
                <Button size="sm" variant="destructive" className="h-7 flex-1 text-xs" disabled={loading}
                    onClick={() => { onReject(notes); setRejecting(false); setNotes(''); }}>
                    {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
                    Confirm Reject
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setRejecting(false); setNotes(''); }}>
                    Cancel
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex gap-1.5">
            <Button size="sm" variant="outline"
                className="h-7 flex-1 border-emerald-300 bg-emerald-50 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                disabled={loading} onClick={onApprove}>
                {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                Approve
            </Button>
            <Button size="sm" variant="outline"
                className="h-7 flex-1 border-red-300 bg-red-50 text-xs text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                disabled={loading} onClick={() => setRejecting(true)}>
                <XCircle className="mr-1 h-3 w-3" />
                Reject
            </Button>
        </div>
    );
}

// ─── Leave Balance Card ───────────────────────────────────────────────────────

function BalanceCard({ b }: { b: LeaveBalance }) {
    const name = b.leave_type?.name ?? `Type #${b.leave_type_id}`;
    const total = b.opening_leaves + b.assigned_leaves;
    const pct = total > 0 ? Math.min((b.consumed_leaves / total) * 100, 100) : 0;
    return (
        <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold leading-snug line-clamp-2">{name}</p>
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium
                    ${b.leave_type?.is_paid !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {b.leave_type?.is_paid !== false ? 'Paid' : 'Unpaid'}
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all duration-500
                    ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-end justify-between">
                <p className="text-[10px] text-muted-foreground">{b.consumed_leaves} / {total} leaves used</p>
                <p className={`text-sm font-bold tabular-nums leading-none
                    ${b.remaining_leaves <= 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {b.remaining_leaves} left
                </p>
            </div>
        </div>
    );
}

// ─── Leave Request Row (admin: can approve/reject pending) ────────────────────

function LeaveRow({ req, onAction }: { req: LeaveRequest; onAction: () => void }) {
    const [actLoading, setActLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const d = days(req.start_date, req.end_date);

    async function approve() {
        setActLoading(true);
        try {
            // POST /api/leave-requests/{id}/approve
            await axios.post(`/api/leave-requests/${req.id}/approve`);
            onAction();
        } catch { /* error handled globally */ }
        finally { setActLoading(false); }
    }

    async function reject(notes: string) {
        setActLoading(true);
        try {
            // POST /api/leave-requests/{id}/reject
            await axios.post(`/api/leave-requests/${req.id}/reject`, { notes: notes || 'Rejected by admin.' });
            onAction();
        } catch { /* error handled globally */ }
        finally { setActLoading(false); }
    }

    return (
        <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                    <p className="text-xs font-semibold">{req.leave_type?.name ?? `Leave #${req.id}`}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                        {fmt(req.start_date)} → {fmt(req.end_date)}
                        <span className="ml-1.5 font-semibold text-foreground">{d}d</span>
                    </p>
                </div>
                <StatusBadge status={req.status} />
            </div>

            {(req.reason || req.approval?.notes) && (
                <div>
                    <button type="button" onClick={() => setExpanded((p) => !p)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                        {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                        {expanded ? 'Less' : 'Details'}
                    </button>
                    {expanded && (
                        <div className="mt-1.5 space-y-1">
                            {req.reason && <p className="text-[10px] italic text-muted-foreground">"{req.reason}"</p>}
                            {req.approval?.notes && (
                                <p className="text-[10px] text-muted-foreground">
                                    ↳ {req.approval.approved_by_user?.name ?? 'Reviewer'}: {req.approval.notes}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {req.status === 'pending' && (
                <ApproveRejectRow onApprove={approve} onReject={reject} loading={actLoading} />
            )}
        </div>
    );
}

// ─── Remote Work Row (admin: can approve/reject pending) ──────────────────────

function RemoteRow({ req, onAction }: { req: RemoteWorkRequest; onAction: () => void }) {
    const [actLoading, setActLoading] = useState(false);
    const d = days(req.start_date, req.end_date);

    async function approve() {
        setActLoading(true);
        try {
            // POST /api/remote-work-requests/{id}/approve
            await axios.post(`/api/remote-work-requests/${req.id}/approve`);
            onAction();
        } catch { /* */ }
        finally { setActLoading(false); }
    }
    async function reject(notes: string) {
        setActLoading(true);
        try {
            // POST /api/remote-work-requests/{id}/reject
            await axios.post(`/api/remote-work-requests/${req.id}/reject`, { notes: notes || 'Rejected by admin.' });
            onAction();
        } catch { /* */ }
        finally { setActLoading(false); }
    }

    return (
        <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                    <div className="flex items-center gap-1.5">
                        <Laptop className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs font-semibold">Remote Work</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                        {fmt(req.start_date)} → {fmt(req.end_date)}
                        <span className="ml-1.5 font-semibold text-foreground">{d}d</span>
                    </p>
                </div>
                <StatusBadge status={req.status} />
            </div>
            {req.reason && <p className="text-[10px] italic text-muted-foreground line-clamp-2">"{req.reason}"</p>}
            {req.approval_notes && (
                <p className="text-[10px] text-muted-foreground">
                    ↳ {req.approved_by_user?.name ?? 'Reviewer'}: {req.approval_notes}
                </p>
            )}
            {req.status === 'pending' && (
                <ApproveRejectRow onApprove={approve} onReject={reject} loading={actLoading} />
            )}
        </div>
    );
}

// ─── Remote Work Assignment Row (admin: can edit/delete) ──────────────────────

function RemoteAssignmentRow({ assignment, onEdit, onDelete }: {
    assignment: RemoteWorkAssignment;
    onEdit: (a: RemoteWorkAssignment) => void;
    onDelete: (id: number) => void;
}) {
    const d = days(assignment.start_date, assignment.end_date);
    return (
        <div className="rounded-lg border bg-card p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Laptop className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="text-xs font-semibold">Remote Work</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                        {fmt(assignment.start_date)} → {fmt(assignment.end_date)}
                        <span className="ml-1.5 font-semibold text-foreground">{d}d</span>
                    </p>
                </div>
                <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => onEdit(assignment)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => onDelete(assignment.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors dark:hover:bg-red-950/30">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            {assignment.notes && <p className="text-[10px] text-muted-foreground line-clamp-2">{assignment.notes}</p>}
            {assignment.assigned_by_user && (
                <p className="text-[10px] text-muted-foreground">Assigned by: {assignment.assigned_by_user.name}</p>
            )}
        </div>
    );
}

// ─── Field Work Row (admin: can edit/delete/approve) ────────────────────────────

function FieldRow({ fw, onEdit, onAction, onDelete }: {
    fw: FieldWorkAssignment;
    onEdit: (fw: FieldWorkAssignment) => void;
    onAction?: () => void;
    onDelete: (id: number) => void;
}) {
    const [loading, setLoading] = useState(false);
    const d = days(fw.start_date, fw.end_date);

    async function approve() {
        setLoading(true);
        try {
            await axios.post(`/admin/field-work-assignments/${fw.id}/approve`);
            onAction?.();
        } catch { /* */ } finally { setLoading(false); }
    }

    async function reject(notes: string) {
        setLoading(true);
        try {
            await axios.post(`/admin/field-work-assignments/${fw.id}/reject`, { notes: notes || 'Rejected by admin.' });
            onAction?.();
        } catch { /* */ } finally { setLoading(false); }
    }

    return (
        <div className="rounded-lg border bg-card p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="text-xs font-semibold truncate">{fw.location}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                        {fmt(fw.start_date)} → {fmt(fw.end_date)}
                        <span className="ml-1.5 font-semibold text-foreground">{d}d</span>
                        {fw.custom_start_time && fw.custom_end_time && (
                            <span className="ml-1.5">· {fw.custom_start_time.slice(0, 5)}–{fw.custom_end_time.slice(0, 5)}</span>
                        )}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <StatusBadge status={fw.status} />
                    <button type="button" onClick={() => onEdit(fw)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => onDelete(fw.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors dark:hover:bg-red-950/30">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            {fw.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{fw.description}</p>}
            {fw.approval_notes && (
                <p className="text-[10px] text-muted-foreground">
                    ↳ {fw.approved_by_user?.name ?? 'Reviewer'}: {fw.approval_notes}
                </p>
            )}
            {fw.status === 'pending' && (
                <ApproveRejectRow onApprove={approve} onReject={reject} loading={loading} />
            )}
        </div>
    );
}

// ─── Assign Leave Dialog ──────────────────────────────────────────────────────

function ShiftAssignmentsTable({ assignments, onEdit }: {
    assignments: ShiftAssignment[];
    onEdit: (assignment: ShiftAssignment) => void;
}) {
    return (
        <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                        <th className="px-3 py-2.5 font-semibold">Shift Name</th>
                        <th className="px-3 py-2.5 font-semibold">From</th>
                        <th className="px-3 py-2.5 font-semibold">To</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {assignments.map((assignment) => {
                        const active = isShiftAssignmentActive(assignment);

                        return (
                            <tr key={assignment.id} className="transition-colors hover:bg-muted/30">
                                <td className="px-3 py-3">
                                    <div className="font-semibold text-foreground">{assignment.shift?.name ?? 'Unknown shift'}</div>
                                    {assignment.shift && <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                                        {assignment.shift.start_time.slice(0, 5)}–{assignment.shift.end_time.slice(0, 5)}
                                    </div>}
                                </td>
                                <td className="px-3 py-3 tabular-nums">{fmt(assignment.effective_from)}</td>
                                <td className="px-3 py-3 tabular-nums">{assignment.effective_to ? fmt(assignment.effective_to) : 'Ongoing'}</td>
                                <td className="px-3 py-3">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${active
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                        : 'border-border bg-muted/60 text-muted-foreground'}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                                        {active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => onEdit(assignment)}>
                                        <Edit2 className="mr-1 h-3.5 w-3.5" />Edit
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

interface ShiftAssignmentForm {
    shift_id: string;
    effective_from: string;
    effective_to: string;
}

const EMPTY_SHIFT_ASSIGNMENT_FORM: ShiftAssignmentForm = { shift_id: '', effective_from: '', effective_to: '' };

function ShiftAssignmentDialog({ open, onOpenChange, employeeId, shifts, editing, onSuccess }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId: number | string;
    shifts: Shift[];
    editing: ShiftAssignment | null;
    onSuccess: () => void;
}) {
    const id = useId();
    const [form, setForm] = useState<ShiftAssignmentForm>(EMPTY_SHIFT_ASSIGNMENT_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setForm(editing ? {
            shift_id: String(editing.shift_id),
            effective_from: editing.effective_from.slice(0, 10),
            effective_to: editing.effective_to?.slice(0, 10) ?? '',
        } : EMPTY_SHIFT_ASSIGNMENT_FORM);
        setError('');
    }, [editing, open]);

    async function submit() {
        if (!form.shift_id || !form.effective_from) {
            setError('Shift and effective from date are required.');
            return;
        }
        if (form.effective_to && form.effective_to < form.effective_from) {
            setError('Effective to date cannot be before the effective from date.');
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        const payload = {
            employee_id: Number(employeeId),
            shift_id: Number(form.shift_id),
            effective_from: form.effective_from,
            effective_to: form.effective_to || null,
            is_active: !form.effective_to || form.effective_to >= today,
        };

        setSaving(true);
        setError('');
        try {
            if (editing) {
                await axios.patch(`/admin/api/shift-assignments/${editing.id}`, payload);
            } else {
                await axios.post('/admin/api/shift-assignments', payload);
            }
            onOpenChange(false);
            onSuccess();
        } catch (e) {
            setError(apiErr(e));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editing ? 'Edit Shift Assignment' : 'Assign Shift'}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`${id}-shift`} className="text-xs">Shift *</Label>
                        <Select value={form.shift_id} onValueChange={(value) => setForm((current) => ({ ...current, shift_id: value }))}>
                            <SelectTrigger id={`${id}-shift`} className="h-9 text-xs"><SelectValue placeholder="Select shift" /></SelectTrigger>
                            <SelectContent>
                                {shifts.filter((shift) => shift.is_active || shift.id === editing?.shift_id).map((shift) => (
                                    <SelectItem key={shift.id} value={String(shift.id)} className="text-xs">
                                        {shift.name} ({shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor={`${id}-from`} className="text-xs">From *</Label>
                            <Input id={`${id}-from`} type="date" className="h-9 text-xs" value={form.effective_from}
                                onChange={(event) => setForm((current) => ({ ...current, effective_from: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`${id}-to`} className="text-xs">To</Label>
                            <Input id={`${id}-to`} type="date" className="h-9 text-xs" min={form.effective_from || undefined}
                                value={form.effective_to}
                                onChange={(event) => setForm((current) => ({ ...current, effective_to: event.target.value }))} />
                            <p className="text-[10px] text-muted-foreground">Leave blank for an ongoing assignment.</p>
                        </div>
                    </div>
                    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button size="sm" onClick={submit} disabled={saving || shifts.length === 0}>
                        {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {editing ? 'Save Changes' : 'Assign Shift'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AssignLeaveDialog({ open, onOpenChange, employeeId, leaveTypes, onSuccess }: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    employeeId: number | string;
    leaveTypes: LeaveType[];
    onSuccess: () => void;
}) {
    const id = useId();
    const [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    function reset() { setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' }); setErr(''); }

    async function submit() {
        if (!form.leave_type_id || !form.start_date || !form.end_date) {
            setErr('Leave type, start date and end date are required.'); return;
        }
        setSaving(true); setErr('');
        try {
            // POST /api/leave-requests
            await axios.post('/api/leave-requests', {
                employee_id: employeeId,
                leave_type_id: form.leave_type_id,
                start_date: form.start_date,
                end_date: form.end_date,
                reason: form.reason || null,
            });
            reset(); onOpenChange(false); onSuccess();
        } catch (e) { setErr(apiErr(e)); }
        finally { setSaving(false); }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Assign Leave</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor={`${id}-lt`} className="text-xs">Leave Type *</Label>
                        <Select value={form.leave_type_id} onValueChange={(v) => setForm((p) => ({ ...p, leave_type_id: v }))}>
                            <SelectTrigger id={`${id}-lt`} className="h-8 text-xs">
                                <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                                {leaveTypes.map((lt) => (
                                    <SelectItem key={lt.id} value={String(lt.id)} className="text-xs">{lt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-sd`} className="text-xs">Start Date *</Label>
                            <Input id={`${id}-sd`} type="date" className="h-8 text-xs"
                                value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-ed`} className="text-xs">End Date *</Label>
                            <Input id={`${id}-ed`} type="date" className="h-8 text-xs"
                                value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`${id}-rs`} className="text-xs">Reason</Label>
                        <Textarea id={`${id}-rs`} placeholder="Optional reason…" className="min-h-[64px] resize-none text-xs"
                            value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
                    </div>
                    {err && <p className="text-xs text-red-600">{err}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
                    <Button size="sm" onClick={submit} disabled={saving}>
                        {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Assign Leave
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Assign Remote Work Assignment Dialog ──────────────────────────────────────

interface RemoteAssignmentForm {
    start_date: string; end_date: string; notes: string;
}

const EMPTY_REMOTE_ASSIGN_FORM: RemoteAssignmentForm = {
    start_date: '', end_date: '', notes: '',
};

function AssignRemoteAssignmentDialog({ open, onOpenChange, employeeId, editing, onSuccess }: {
    open: boolean; onOpenChange: (o: boolean) => void;
    employeeId: number | string;
    editing: RemoteWorkAssignment | null;
    onSuccess: () => void;
}) {
    const id = useId();
    const [form, setForm] = useState<RemoteAssignmentForm>(EMPTY_REMOTE_ASSIGN_FORM);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (editing) {
            setForm({
                start_date: editing.start_date,
                end_date: editing.end_date,
                notes: editing.notes ?? '',
            });
        } else {
            setForm(EMPTY_REMOTE_ASSIGN_FORM);
        }
        setErr('');
    }, [editing, open]);

    function set(k: keyof RemoteAssignmentForm) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((p) => ({ ...p, [k]: e.target.value }));
    }

    async function submit() {
        if (!form.start_date || !form.end_date) {
            setErr('Start date and end date are required.'); return;
        }
        setSaving(true); setErr('');
        const payload = {
            employee_id: employeeId,
            start_date: form.start_date,
            end_date: form.end_date,
            notes: form.notes || null,
        };
        try {
            if (editing) {
                // PUT /admin/remote-work-assignments/{id}
                await axios.put(`/admin/remote-work-assignments/${editing.id}`, payload);
            } else {
                // POST /admin/remote-work-assignments
                await axios.post('/admin/remote-work-assignments', payload);
            }
            onOpenChange(false); onSuccess();
        } catch (e) { setErr(apiErr(e)); }
        finally { setSaving(false); }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Remote Work Assignment' : 'Assign Remote Work'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-sd`} className="text-xs">Start Date *</Label>
                            <Input id={`${id}-sd`} type="date" className="h-8 text-xs"
                                value={form.start_date} onChange={set('start_date')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-ed`} className="text-xs">End Date *</Label>
                            <Input id={`${id}-ed`} type="date" className="h-8 text-xs"
                                value={form.end_date} onChange={set('end_date')} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`${id}-notes`} className="text-xs">Notes</Label>
                        <Textarea id={`${id}-notes`} placeholder="Optional notes…" className="min-h-[64px] resize-none text-xs"
                            value={form.notes} onChange={set('notes')} />
                    </div>
                    {err && <p className="text-xs text-red-600">{err}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button size="sm" onClick={submit} disabled={saving}>
                        {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {editing ? 'Save Changes' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Assign / Edit Field Work Dialog ─────────────────────────────────────────

interface FieldForm {
    start_date: string; end_date: string; location: string;
    description: string; custom_start_time: string; custom_end_time: string; notes: string;
}

const EMPTY_FIELD_FORM: FieldForm = {
    start_date: '', end_date: '', location: '',
    description: '', custom_start_time: '', custom_end_time: '', notes: '',
};

function FieldWorkDialog({ open, onOpenChange, employeeId, editing, onSuccess }: {
    open: boolean; onOpenChange: (o: boolean) => void;
    employeeId: number | string;
    editing: FieldWorkAssignment | null;
    onSuccess: () => void;
}) {
    const id = useId();
    const [form, setForm] = useState<FieldForm>(EMPTY_FIELD_FORM);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (editing) {
            setForm({
                start_date: editing.start_date,
                end_date: editing.end_date,
                location: editing.location,
                description: editing.description ?? '',
                custom_start_time: editing.custom_start_time?.slice(0, 5) ?? '',
                custom_end_time: editing.custom_end_time?.slice(0, 5) ?? '',
                notes: editing.notes ?? '',
            });
        } else {
            setForm(EMPTY_FIELD_FORM);
        }
        setErr('');
    }, [editing, open]);

    function set(k: keyof FieldForm) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((p) => ({ ...p, [k]: e.target.value }));
    }

    async function submit() {
        if (!form.start_date || !form.end_date || !form.location.trim()) {
            setErr('Location, start date and end date are required.'); return;
        }
        setSaving(true); setErr('');
        const payload = {
            employee_id: employeeId,
            start_date: form.start_date,
            end_date: form.end_date,
            location: form.location.trim(),
            description: form.description || null,
            custom_start_time: form.custom_start_time || null,
            custom_end_time: form.custom_end_time || null,
            notes: form.notes || null,
        };
        try {
            if (editing) {
                // PUT /admin/field-work-assignments/{id}
                await axios.put(`/admin/field-work-assignments/${editing.id}`, payload);
            } else {
                // POST /admin/field-work-assignments
                await axios.post('/admin/field-work-assignments', payload);
            }
            onOpenChange(false); onSuccess();
        } catch (e) { setErr(apiErr(e)); }
        finally { setSaving(false); }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Field Work' : 'Assign Field Work'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor={`${id}-loc`} className="text-xs">Location *</Label>
                        <Input id={`${id}-loc`} placeholder="e.g. Client Site — Guwahati" className="h-8 text-xs"
                            value={form.location} onChange={set('location')} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-sd`} className="text-xs">Start Date *</Label>
                            <Input id={`${id}-sd`} type="date" className="h-8 text-xs"
                                value={form.start_date} onChange={set('start_date')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-ed`} className="text-xs">End Date *</Label>
                            <Input id={`${id}-ed`} type="date" className="h-8 text-xs"
                                value={form.end_date} onChange={set('end_date')} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-cst`} className="text-xs">Custom Start Time</Label>
                            <Input id={`${id}-cst`} type="time" className="h-8 text-xs"
                                value={form.custom_start_time} onChange={set('custom_start_time')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`${id}-cet`} className="text-xs">Custom End Time</Label>
                            <Input id={`${id}-cet`} type="time" className="h-8 text-xs"
                                value={form.custom_end_time} onChange={set('custom_end_time')} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`${id}-desc`} className="text-xs">Description</Label>
                        <Textarea id={`${id}-desc`} placeholder="What will the employee be doing?" className="min-h-[56px] resize-none text-xs"
                            value={form.description} onChange={set('description')} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`${id}-notes`} className="text-xs">Internal Notes</Label>
                        <Input id={`${id}-notes`} placeholder="Optional internal notes" className="h-8 text-xs"
                            value={form.notes} onChange={set('notes')} />
                    </div>
                    {err && <p className="text-xs text-red-600">{err}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button size="sm" onClick={submit} disabled={saving}>
                        {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {editing ? 'Save Changes' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteDialog({ open, onOpenChange, onConfirm, loading }: {
    open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void; loading: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xs">
                <DialogHeader><DialogTitle>Delete Assignment?</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This field work assignment will be permanently removed.</p>
                <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>
                        {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function LeavePanel({ employeeId }: LeavePanelProps) {
    const [year, setYear] = useState(CURRENT_YEAR);
    const [view, setView] = useState<PanelView>('leaves');
    const [filter, setFilter] = useState<RequestStatus | 'all'>('all');

    // Data
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [leaveReqs, setLeaveReqs] = useState<LeaveRequest[]>([]);
    const [remoteReqs, setRemoteReqs] = useState<RemoteWorkRequest[]>([]);
    const [remoteAssign, setRemoteAssign] = useState<RemoteWorkAssignment[]>([]);
    const [fieldWork, setFieldWork] = useState<FieldWorkAssignment[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);

    // Loading / error per section
    const [balL, setBalL] = useState(false); const [balE, setBalE] = useState('');
    const [reqL, setReqL] = useState(false); const [reqE, setReqE] = useState('');
    const [remL, setRemL] = useState(false); const [remE, setRemE] = useState('');
    const [fwL, setFwL] = useState(false); const [fwE, setFwE] = useState('');
    const [shiftL, setShiftL] = useState(false); const [shiftE, setShiftE] = useState('');
    const [delL, setDelL] = useState(false);

    // Dialog state
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [remoteAssignOpen, setRemoteAssignOpen] = useState(false);
    const [fieldOpen, setFieldOpen] = useState(false);
    const [shiftOpen, setShiftOpen] = useState(false);
    const [editingFw, setEditingFw] = useState<FieldWorkAssignment | null>(null);
    const [editingRemoteAssign, setEditingRemoteAssign] = useState<RemoteWorkAssignment | null>(null);
    const [editingShift, setEditingShift] = useState<ShiftAssignment | null>(null);
    const [deleteId, setDeleteId] = useState<{ type: 'field' | 'remote'; id: number } | null>(null);

    // ── Fetchers ────────────────────────────────────────────────────────────

    const fetchBalances = useCallback(async (y: number) => {
        setBalL(true); setBalE('');
        try {
            const { data } = await axios.get(`/api/employees/${employeeId}/leave-balance`, { params: { year: y } });
            setBalances(unpack<LeaveBalance>(data));
        } catch (e) { setBalE(apiErr(e)); } finally { setBalL(false); }
    }, [employeeId]);

    const fetchLeaveReqs = useCallback(async (y: number) => {
        setReqL(true); setReqE('');
        try {
            const { data } = await axios.get(`/api/employees/${employeeId}/leave-requests`, { params: { year: y, per_page: 50 } });
            setLeaveReqs(unpack<LeaveRequest>(data));
        } catch (e) { setReqE(apiErr(e)); } finally { setReqL(false); }
    }, [employeeId]);

    const fetchRemote = useCallback(async (y: number) => {
        setRemL(true); setRemE('');
        try {
            const { data } = await axios.get(`/api/employees/${employeeId}/remote-work-requests`, { params: { year: y, per_page: 50 } });
            setRemoteReqs(unpack<RemoteWorkRequest>(data));
        } catch (e) { setRemE(apiErr(e)); } finally { setRemL(false); }
    }, [employeeId]);

    const fetchRemoteAssign = useCallback(async (y: number) => {
        try {
            const { data } = await axios.get(`/api/employees/${employeeId}/remote-work-assignments`, { params: { year: y, per_page: 50 } });
            setRemoteAssign(unpack<RemoteWorkAssignment>(data));
        } catch { /* ignore errors, assignments are secondary */ }
    }, [employeeId]);

    const fetchField = useCallback(async (y: number) => {
        setFwL(true); setFwE('');
        try {
            const { data } = await axios.get(`/api/employees/${employeeId}/field-work-assignments`, { params: { year: y, per_page: 50 } });
            setFieldWork(unpack<FieldWorkAssignment>(data));
        } catch (e) { setFwE(apiErr(e)); } finally { setFwL(false); }
    }, [employeeId]);

    const fetchShiftAssignments = useCallback(async () => {
        setShiftL(true); setShiftE('');
        try {
            const [assignmentsResponse, shiftsResponse] = await Promise.all([
                axios.get(`/admin/api/employees/${employeeId}/shift-assignments`),
                axios.get('/admin/api/shifts'),
            ]);
            setShiftAssignments(unpack<ShiftAssignment>(assignmentsResponse.data));
            setShifts(unpack<Shift>(shiftsResponse.data));
        } catch (e) {
            setShiftE(apiErr(e));
        } finally {
            setShiftL(false);
        }
    }, [employeeId]);

    const fetchLeaveTypes = useCallback(async () => {
        try {
            // GET /api/leave-types?active_only=true
            const { data } = await axios.get('/api/leave-types', { params: { active_only: true } });
            if(data.total){
                setLeaveTypes(unpack<LeaveType>(data.leave_types));
            }
        } catch { /* non-critical */ }
    }, []);

    useEffect(() => {
        fetchLeaveTypes();
    }, [fetchLeaveTypes]);

    useEffect(() => {
        fetchBalances(year);
        fetchLeaveReqs(year);
        fetchRemote(year);
        fetchRemoteAssign(year);
        fetchField(year);
        fetchShiftAssignments();
        setFilter('all');
    }, [year, fetchBalances, fetchLeaveReqs, fetchRemote, fetchRemoteAssign, fetchField, fetchShiftAssignments]);

    // ── Delete operations ────────────────────────────────────────────────────

    async function deleteItem() {
        if (!deleteId) return;
        setDelL(true);
        try {
            if (deleteId.type === 'field') {
                await axios.delete(`/admin/field-work-assignments/${deleteId.id}`);
                fetchField(year);
            } else if (deleteId.type === 'remote') {
                await axios.delete(`/admin/remote-work-assignments/${deleteId.id}`);
                fetchRemoteAssign(year);
            }
            setDeleteId(null);
        } catch { /* */ } finally { setDelL(false); }
    }

    // ── Derived ──────────────────────────────────────────────────────────────

    const pendingLeave = leaveReqs.filter((r) => r.status === 'pending').length;
    const pendingRemote = remoteReqs.filter((r) => r.status === 'pending').length;
    const filteredLeave = filter === 'all' ? leaveReqs : leaveReqs.filter((r) => r.status === filter);
    const filteredRemote = filter === 'all' ? remoteReqs : remoteReqs.filter((r) => r.status === filter);
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const visibleShiftAssignments = shiftAssignments.filter((assignment) => (
        assignment.effective_from.slice(0, 10) <= yearEnd
        && (!assignment.effective_to || assignment.effective_to.slice(0, 10) >= yearStart)
    ));

    const VIEW_CONFIG: Record<PanelView, { label: string; pending?: number }> = {
        leaves: { label: 'Leave', pending: pendingLeave },
        remote: { label: 'Remote Work', pending: pendingRemote },
        field: { label: 'Field Work', pending: 0 },
        shift: { label: 'Shift', pending: 0 },
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <div className="space-y-4">

                {/* ── Top bar ── */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* View toggle */}
                    <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                        {(Object.keys(VIEW_CONFIG) as PanelView[]).map((v) => {
                            const { label, pending } = VIEW_CONFIG[v];
                            return (
                                <button key={v} type="button"
                                    onClick={() => { setView(v); setFilter('all'); }}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors
                                        ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {label}
                                    {pending != null && pending > 0 && (
                                        <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                                            {pending}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Year selector */}
                    <div className="flex gap-1">
                        {YEAR_OPTIONS.map((y) => (
                            <button key={y} type="button" onClick={() => setYear(y)}
                                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors
                                    ${year === y ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                                {y}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══ LEAVE VIEW ══ */}
                {view === 'leaves' && (
                    <div className="space-y-5">
                        <div className="flex justify-end">
                            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                <Link href="/admin/leave-types">
                                    <ExternalLink className="mr-1 h-3 w-3" />Leave Management
                                </Link>
                            </Button>
                        </div>
                        {/* Balances */}
                        <section className="space-y-2.5">
                            <SectionHead icon={TrendingUp} title={`Balances — ${year}`} />
                            {balL ? <Skeleton rows={2} h="h-20" />
                                : balE ? <SectionErr msg={balE} onRetry={() => fetchBalances(year)} />
                                    : balances.length === 0 ? <Empty icon={TrendingUp} msg="No balances for this year." />
                                        : <div className="grid grid-cols-2 gap-2">{balances.map((b) => <BalanceCard key={b.id} b={b} />)}</div>
                            }
                        </section>

                        {/* Leave Requests */}
                        <section className="space-y-2.5">
                            <SectionHead icon={CalendarDays} title="Leave Requests"
                                action={
                                    <div className="flex items-center gap-2">
                                        {!reqL && leaveReqs.length > 0 && (
                                            <FilterPills value={filter} onChange={setFilter} pendingCount={pendingLeave} />
                                        )}
                                        <Button size="sm" variant="outline" className="h-7 text-xs"
                                            onClick={() => setLeaveOpen(true)}>
                                            <Plus className="mr-1 h-3 w-3" />Assign
                                        </Button>
                                    </div>
                                }
                            />
                            {reqL ? <Skeleton />
                                : reqE ? <SectionErr msg={reqE} onRetry={() => fetchLeaveReqs(year)} />
                                    : filteredLeave.length === 0 ? <Empty icon={CalendarDays} msg={filter === 'all' ? 'No leave requests.' : `No ${filter} requests.`} />
                                        : <div className="space-y-2">{filteredLeave.map((r) => (
                                            <LeaveRow key={r.id} req={r} onAction={() => fetchLeaveReqs(year)} />
                                        ))}</div>
                            }
                        </section>
                    </div>
                )}

                {/* ══ REMOTE WORK VIEW (combined requests + assignments) ══ */}
                {view === 'remote' && (
                    <div className="space-y-5">
                        {/* if employee_id is logged user id Remote Work Requests*/}
                        {/* else Assign remote work */}
                        <section>
                            <SectionHead icon={Laptop} title="Remote Work Assignments"
                                action={
                                    <div className="flex items-center gap-2">

                                        <Button size="sm" variant="outline" className="h-7 text-xs"
                                            onClick={() => { setEditingRemoteAssign(null); setRemoteAssignOpen(true); }}>
                                            <Plus className="mr-1 h-3 w-3" />Assign
                                        </Button>
                                    </div>
                                }
                            />

                            {remoteAssign.map((a) => (
                                <RemoteAssignmentRow key={`assign-${a.id}`} assignment={a}
                                    onEdit={(a) => { setEditingRemoteAssign(a); setRemoteAssignOpen(true); }}
                                    onDelete={(id) => setDeleteId({ type: 'remote', id })}
                                />
                            ))}
                        </section>

                        <section className="space-y-2.5">
                            <SectionHead icon={Laptop} title="Remote Work Requests"
                                action={
                                    <div className="flex items-center gap-2">
                                        {!remL && remoteReqs.length > 0 && (
                                            <FilterPills value={filter} onChange={setFilter} pendingCount={pendingRemote} />
                                        )}
                                    </div>
                                }
                            />
                            {remL ? <Skeleton />
                                : remE ? <SectionErr msg={remE} onRetry={() => fetchRemote(year)} />
                                    : filteredRemote.length === 0 && remoteAssign.length === 0 ? <Empty icon={Laptop} msg={filter === 'all' ? 'No remote work requests or assignments.' : `No ${filter} requests.`} />
                                        : <div className="space-y-2">
                                            {filteredRemote.map((r) => (
                                                <RemoteRow key={`req-${r.id}`} req={r} onAction={() => fetchRemote(year)} />
                                            ))}
                                        </div>
                            }
                        </section>
                    </div>
                )}

                {/* ══ FIELD WORK VIEW ══ */}
                {view === 'field' && (
                    <section className="space-y-2.5">
                        <SectionHead icon={MapPin} title="Field Work Assignments"
                            action={
                                <div className="flex items-center gap-2">
                                    {!fwL && fieldWork.length > 0 && (
                                        <FilterPills value={filter} onChange={setFilter} pendingCount={0} />
                                    )}
                                    <Button size="sm" variant="outline" className="h-7 text-xs"
                                        onClick={() => { setEditingFw(null); setFieldOpen(true); }}>
                                        <Plus className="mr-1 h-3 w-3" />Assign
                                    </Button>
                                </div>
                            }
                        />
                        {fwL ? <Skeleton />
                            : fwE ? <SectionErr msg={fwE} onRetry={() => fetchField(year)} />
                                : fieldWork.length === 0 ? <Empty icon={MapPin} msg="No field work assignments this year." />
                                    : <div className="space-y-2">{fieldWork.map((fw) => (
                                        <FieldRow key={fw.id} fw={fw}
                                            onEdit={(f) => { setEditingFw(f); setFieldOpen(true); }}
                                            onAction={() => fetchField(year)}
                                            onDelete={(id) => setDeleteId({ type: 'field', id })}
                                        />
                                    ))}</div>
                        }
                    </section>
                )}

                {view === 'shift' && (
                    <section className="space-y-2.5">
                        <SectionHead icon={CalendarClock} title={`Shift Assignments — ${year}`}
                            action={
                                <Button size="sm" className="h-8 text-xs"
                                    onClick={() => { setEditingShift(null); setShiftOpen(true); }}>
                                    <Plus className="mr-1 h-3.5 w-3.5" />Assign Shift
                                </Button>
                            }
                        />
                        {shiftL ? <Skeleton rows={3} h="h-14" />
                            : shiftE ? <SectionErr msg={shiftE} onRetry={fetchShiftAssignments} />
                                : visibleShiftAssignments.length === 0
                                    ? <Empty icon={CalendarClock} msg={`No shift assignments found for ${year}.`} />
                                    : <ShiftAssignmentsTable assignments={visibleShiftAssignments}
                                        onEdit={(assignment) => { setEditingShift(assignment); setShiftOpen(true); }} />
                        }
                    </section>
                )}
            </div>

            {/* ── Dialogs ── */}
            <AssignLeaveDialog
                open={leaveOpen} onOpenChange={setLeaveOpen}
                employeeId={employeeId}
                leaveTypes={leaveTypes}
                onSuccess={() => { fetchLeaveReqs(year); fetchBalances(year); }}
            />
            <AssignRemoteAssignmentDialog
                open={remoteAssignOpen} onOpenChange={setRemoteAssignOpen}
                employeeId={employeeId} editing={editingRemoteAssign}
                onSuccess={() => fetchRemoteAssign(year)}
            />
            <FieldWorkDialog
                open={fieldOpen} onOpenChange={setFieldOpen}
                employeeId={employeeId} editing={editingFw}
                onSuccess={() => fetchField(year)}
            />
            <ShiftAssignmentDialog
                open={shiftOpen} onOpenChange={setShiftOpen}
                employeeId={employeeId} shifts={shifts} editing={editingShift}
                onSuccess={fetchShiftAssignments}
            />
            <DeleteDialog
                open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}
                onConfirm={deleteItem} loading={delL}
            />
        </>
    );
}
