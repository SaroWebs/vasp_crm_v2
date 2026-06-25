import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Pencil, CalendarCog, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Attendance', href: '/admin/attendance' },
    { title: 'Op Month Cycle Rules', href: '/admin/attendance/cycle-rules' },
];

interface CycleRule {
    id: number;
    month_starts_on: number;
    effective_from: string;
    effective_to: string | null;
    include_gap_in_current: boolean;
    created_at: string;
    creator?: { name: string } | null;
    derived_preview?: Array<{ label: string; start_date: string; end_date: string }>;
}

interface FormState {
    month_starts_on: string;
    effective_from: string;
    effective_to: string;
    include_gap_in_current: boolean;
}

const emptyForm: FormState = {
    month_starts_on: '21',
    effective_from: '',
    effective_to: '',
    include_gap_in_current: true,
};

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

export default function CycleRulesPage() {
    const [rules, setRules] = useState<CycleRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [editRule, setEditRule] = useState<CycleRule | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [preview, setPreview] = useState<Array<{ label: string; start_date: string; end_date: string }>>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [gapWarning, setGapWarning] = useState<string | null>(null);

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/api/attendance/cycle-rules');
            if (res.data.status === 'success') {
                setRules(res.data.data ?? []);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchRules(); }, [fetchRules]);

    const fetchPreview = useCallback(async (f: FormState) => {
        if (!f.effective_from || !f.month_starts_on) return;
        setPreviewLoading(true);
        setGapWarning(null);
        try {
            const res = await axios.get('/admin/api/attendance/cycle-rules/preview', {
                params: {
                    month_starts_on: f.month_starts_on,
                    effective_from: f.effective_from,
                    effective_to: f.effective_to || null,
                    include_gap_in_current: f.include_gap_in_current ? 1 : 0,
                },
            });
            if (res.data.status === 'success') {
                setPreview(res.data.preview ?? []);
                setGapWarning(res.data.gap_warning ?? null);
            }
        } catch {
            setPreview([]);
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    // Debounce preview fetch
    useEffect(() => {
        const t = setTimeout(() => { if (open) void fetchPreview(form); }, 600);
        return () => clearTimeout(t);
    }, [form, open, fetchPreview]);

    function openCreate() {
        setEditRule(null);
        setForm(emptyForm);
        setErrors({});
        setPreview([]);
        setGapWarning(null);
        setSuccessMsg(null);
        setOpen(true);
    }

    function openEdit(rule: CycleRule) {
        setEditRule(rule);
        setForm({
            month_starts_on: String(rule.month_starts_on),
            effective_from: rule.effective_from,
            effective_to: rule.effective_to ?? '',
            include_gap_in_current: rule.include_gap_in_current,
        });
        setErrors({});
        setPreview([]);
        setGapWarning(null);
        setSuccessMsg(null);
        setOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        setErrors({});
        setSuccessMsg(null);
        try {
            const payload = {
                month_starts_on: Number(form.month_starts_on),
                effective_from: form.effective_from,
                effective_to: form.effective_to || null,
                include_gap_in_current: form.include_gap_in_current,
            };

            if (editRule) {
                await axios.put(`/admin/api/attendance/cycle-rules/${editRule.id}`, payload);
            } else {
                await axios.post('/admin/api/attendance/cycle-rules', payload);
            }

            setSuccessMsg(editRule ? 'Rule updated successfully.' : 'Rule created successfully.');
            setOpen(false);
            void fetchRules();
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data?.errors) {
                setErrors(err.response.data.errors as Record<string, string>);
            }
        } finally {
            setSaving(false);
        }
    }

    const activeRule = rules.find(r => r.effective_to === null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Op Month Cycle Rules" />

            <div className="flex flex-col gap-6 p-4 sm:p-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <CalendarCog className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Operational Month Cycle Rules</h1>
                            <p className="text-sm text-muted-foreground">
                                Define which day of the month each attendance cycle begins.
                            </p>
                        </div>
                    </div>
                    <Button onClick={openCreate} size="sm" className="shrink-0">
                        <Plus className="mr-1.5 h-4 w-4" />
                        New Rule
                    </Button>
                </div>

                {successMsg && (
                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{successMsg}</AlertDescription>
                    </Alert>
                )}

                {/* Active rule banner */}
                {activeRule && (
                    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                        <Info className="h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm">
                            <span className="font-medium">Active Rule:</span>{' '}
                            Cycles begin on the{' '}
                            <span className="font-semibold text-primary">{ordinal(activeRule.month_starts_on)}</span>{' '}
                            of each month — effective since{' '}
                            <span className="font-medium">{formatDate(activeRule.effective_from)}</span>
                        </p>
                    </div>
                )}

                {/* Rules table */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Rule History</CardTitle>
                        <CardDescription>All configured cycle rules, ordered chronologically.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : rules.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No cycle rules configured yet. Create one to get started.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Starts On</TableHead>
                                        <TableHead>Effective From</TableHead>
                                        <TableHead>Effective To</TableHead>
                                        <TableHead>Gap Absorption</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rules.map((rule) => (
                                        <TableRow key={rule.id}>
                                            <TableCell className="font-medium">
                                                {ordinal(rule.month_starts_on)} of month
                                            </TableCell>
                                            <TableCell>{formatDate(rule.effective_from)}</TableCell>
                                            <TableCell>{formatDate(rule.effective_to)}</TableCell>
                                            <TableCell>
                                                {rule.include_gap_in_current ? (
                                                    <Badge variant="secondary">Absorbed</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Excluded</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {rule.effective_to === null ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400">
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Closed</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => openEdit(rule)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editRule ? 'Edit Cycle Rule' : 'New Cycle Rule'}</DialogTitle>
                        <DialogDescription>
                            {editRule
                                ? 'Update the cycle rule. Changing an active rule affects all future cycle calculations.'
                                : 'Add a new rule defining when each attendance cycle begins.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-2">

                        {/* Month starts on */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="month_starts_on">Month Starts On (day 1–31)</Label>
                            <Input
                                id="month_starts_on"
                                type="number"
                                min={1}
                                max={31}
                                value={form.month_starts_on}
                                onChange={(e) => setForm(f => ({ ...f, month_starts_on: e.target.value }))}
                                placeholder="e.g. 21"
                            />
                            {form.month_starts_on && Number(form.month_starts_on) >= 29 && (
                                <p className="text-xs text-amber-600">
                                    ⚠ For months with fewer days, the cycle will start on the last day of that month.
                                </p>
                            )}
                            {errors.month_starts_on && <p className="text-xs text-destructive">{errors.month_starts_on}</p>}
                        </div>

                        {/* Effective From */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="effective_from">Effective From</Label>
                            <Input
                                id="effective_from"
                                type="date"
                                value={form.effective_from}
                                onChange={(e) => setForm(f => ({ ...f, effective_from: e.target.value }))}
                            />
                            {errors.effective_from && <p className="text-xs text-destructive">{errors.effective_from}</p>}
                        </div>

                        {/* Effective To */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="effective_to">
                                Effective To{' '}
                                <span className="text-muted-foreground">(leave blank = ongoing)</span>
                            </Label>
                            <Input
                                id="effective_to"
                                type="date"
                                value={form.effective_to}
                                onChange={(e) => setForm(f => ({ ...f, effective_to: e.target.value }))}
                            />
                            {errors.effective_to && <p className="text-xs text-destructive">{errors.effective_to}</p>}
                        </div>

                        {/* Include gap */}
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                            <Switch
                                id="include_gap"
                                checked={form.include_gap_in_current}
                                onCheckedChange={(v) => setForm(f => ({ ...f, include_gap_in_current: v }))}
                            />
                            <div>
                                <Label htmlFor="include_gap" className="cursor-pointer font-medium">
                                    Include gap days in first cycle
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    If there are untracked days between the previous rule and this one, absorb them into this rule's first cycle.
                                </p>
                            </div>
                        </div>

                        {/* Gap warning */}
                        {gapWarning && (
                            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700 dark:text-amber-400">{gapWarning}</AlertDescription>
                            </Alert>
                        )}

                        {/* Preview */}
                        {(previewLoading || preview.length > 0) && (
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Preview — first 3 cycles
                                </p>
                                {previewLoading ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Computing...
                                    </div>
                                ) : (
                                    <ul className="space-y-1">
                                        {preview.slice(0, 3).map((p, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs">
                                                <span className="font-medium">Cycle {i + 1}:</span>
                                                <span className="text-muted-foreground">{p.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            {editRule ? 'Update Rule' : 'Save Rule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
