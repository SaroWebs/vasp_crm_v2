/**
 * Variation 1 — Monochrome Precision
 *
 * Design direction: Dark-accent precision. Sharp edges, tight spacing,
 * near-black primary action button, muted neutral palette.
 * Swap the Mantine Badge for a plain span badge to remove the dependency.
 */
 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatDurationMs } from '@/lib/taskTimeEntriesGanttDetails';
import { computeClippedMinuteRange } from '@/lib/taskTimeEntriesGanttMath';
import { TimeEntry } from '@/types';
import { Modal } from '@mantine/core';
import axios from 'axios';
import { addMinutes, format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, RotateCcw, Save, Trash, XIcon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
 
/* ─── types & constants (identical to original) ─── */
type DraftMap = Record<number, { start: Date; end: Date }>;
type DragKind = 'move' | 'resize-start' | 'resize-end';
type DragState = {
    entryId: number; kind: DragKind; originClientX: number;
    originStartMin: number; originEndMin: number;
    pxPerMinute: number; dayStart: Date;
};
type Bar = { entry: TimeEntry; startMin: number; endMin: number; lane: number; isEditable: boolean; };
 
const TOTAL_MINUTES = 24 * 60;
const SNAP_MINUTES = 5;
const MIN_DURATION_MINUTES = 5;
const HOUR_WIDTH = 90;
 
/* ─── helpers (identical to original) ─── */
function startOfDay(d: Date) { const c = new Date(d); c.setHours(0,0,0,0); return c; }
function endOfDay(d: Date)   { const c = new Date(d); c.setHours(23,59,59,999); return c; }
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate()+n); return c; }
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }
function toDateInputValue(d: Date) { return format(d, 'yyyy-MM-dd'); }
function parseDateTimeLocal(v: string): Date | null {
    if (!v) return null; const p = new Date(v); return isNaN(p.getTime()) ? null : p;
}
function buildLanes(bars: Omit<Bar,'lane'>[]): Bar[] {
    const sorted = [...bars].sort((a,b) => a.startMin - b.startMin);
    const ends: number[] = [];
    return sorted.map(bar => {
        let i = ends.findIndex(e => e <= bar.startMin);
        if (i === -1) { i = ends.length; ends.push(bar.endMin); } else { ends[i] = bar.endMin; }
        return { ...bar, lane: i };
    });
}
 
/* ─── inline badge ─── */
const MonoBadge = ({ children, variant = 'filled' }: { children: React.ReactNode; variant?: 'filled' | 'outline' }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center',
        fontSize: 11, padding: '2px 7px', borderRadius: 4,
        background: variant === 'outline' ? 'transparent' : 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        color: 'var(--color-text-secondary)',
    }}>
        {children}
    </span>
);
 
/* ─── component ─── */
interface Props { taskId: number; timeEntries: TimeEntry[]; onChange?: (e: TimeEntry[]) => void; }
 
export default function TaskTimeEntriesGanttEditor({ taskId, timeEntries, onChange }: Props) {
    const [entries, setEntries]           = useState<TimeEntry[]>(timeEntries);
    const [drafts, setDrafts]             = useState<DraftMap>({});
    const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(() =>
        timeEntries.length > 0 ? new Date(timeEntries[0].start_time) : new Date());
    const [isAddOpen, setIsAddOpen]       = useState(false);
    const [addStart, setAddStart]         = useState('');
    const [addEnd, setAddEnd]             = useState('');
    const [addDescription, setAddDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveError, setSaveError]       = useState<string | null>(null);
    const [isDragging, setIsDragging]     = useState(false);
    const [deleteEntry, setDeleteEntry]   = useState<TimeEntry | null>(null);
    const [maxDateTimeLocal, setMaxDateTimeLocal] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [now, setNow] = useState<Date>(() => new Date());
 
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const dragRef     = useRef<DragState | null>(null);
    const autoFocusTodayRef = useRef(false);
 
    useEffect(() => { setEntries(timeEntries); }, [timeEntries]);
    useEffect(() => {
        if (!isAddOpen) {
            return;
        }

        setMaxDateTimeLocal(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }, [isAddOpen]);
 
    const selectedEntry = useMemo(() =>
        selectedEntryId === null ? null : entries.find(e => e.id === selectedEntryId) ?? null,
    [entries, selectedEntryId]);
 
    useEffect(() => {
        if (selectedEntryId !== null && !entries.some(e => e.id === selectedEntryId))
            setSelectedEntryId(null);
    }, [entries, selectedEntryId]);
 
    const dayStart    = useMemo(() => startOfDay(selectedDate), [selectedDate]);
    const dayEnd      = useMemo(() => endOfDay(selectedDate),   [selectedDate]);
    const widthPx     = 24 * HOUR_WIDTH;
    const pxPerMinute = widthPx / TOTAL_MINUTES;
    const isDirty     = Object.keys(drafts).length > 0;

    const isSelectedDateToday = useMemo(() => {
        return dayStart.getTime() === startOfDay(new Date()).getTime();
    }, [dayStart]);

    useEffect(() => {
        if (!isSelectedDateToday) {
            autoFocusTodayRef.current = false;
            return;
        }

        setNow(new Date());

        const intervalId = window.setInterval(() => {
            setNow(new Date());
        }, 30_000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isSelectedDateToday]);

    const nowMinute = useMemo(() => {
        if (!isSelectedDateToday) {
            return null;
        }

        const minutes = Math.floor((now.getTime() - dayStart.getTime()) / 60_000);
        return clamp(minutes, 0, TOTAL_MINUTES);
    }, [dayStart, isSelectedDateToday, now]);

    const focusNow = useCallback(() => {
        const container = timelineRef.current;
        if (!container || nowMinute === null) {
            return;
        }

        const paddingLeft = Number.parseFloat(window.getComputedStyle(container).paddingLeft || '0') || 0;
        const markerX = paddingLeft + nowMinute * pxPerMinute;
        const desiredScrollLeft = markerX - container.clientWidth / 2;
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);

        container.scrollLeft = clamp(desiredScrollLeft, 0, maxScrollLeft);
    }, [nowMinute, pxPerMinute]);

    useEffect(() => {
        if (!isSelectedDateToday || autoFocusTodayRef.current) {
            return;
        }

        autoFocusTodayRef.current = true;

        window.requestAnimationFrame(() => {
            focusNow();
        });
    }, [focusNow, isSelectedDateToday]);
 
    const bars = useMemo(() => {
        const now = new Date();
        const raw = entries.map(entry => {
            const draft = drafts[entry.id];
            const start = draft?.start ?? new Date(entry.start_time);
            const end   = draft?.end   ?? new Date(entry.end_time ?? now);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
            const range = computeClippedMinuteRange({ dayStart, dayEnd, start, end, totalMinutes: TOTAL_MINUTES });
            if (!range) return null;
            return { entry, startMin: range.startMin, endMin: range.endMin,
                     isEditable: !entry.is_active && Boolean(entry.end_time) } satisfies Omit<Bar,'lane'>;
        }).filter((b): b is Omit<Bar,'lane'> => Boolean(b));
        return buildLanes(raw);
    }, [dayEnd, dayStart, drafts, entries]);
 
    const lanesCount = useMemo(() =>
        bars.length === 0 ? 1 : Math.max(...bars.map(b => b.lane)) + 1, [bars]);
 
    const gridHours = useMemo(() => Array.from({ length: 25 }, (_, h) => h), []);
 
    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (ev: PointerEvent) => {
            const drag = dragRef.current; const container = timelineRef.current;
            if (!drag || !container) return;
            const rect = container.getBoundingClientRect();
            const deltaPx  = ev.clientX - drag.originClientX;
            const snapped  = Math.round((deltaPx / drag.pxPerMinute) / SNAP_MINUTES) * SNAP_MINUTES;
            let ns = drag.originStartMin, ne = drag.originEndMin;
            if (drag.kind === 'move') {
                const dur = ne - ns; ns = clamp(ns + snapped, 0, TOTAL_MINUTES - dur); ne = ns + dur;
            } else if (drag.kind === 'resize-start') {
                ns = clamp(ns + snapped, 0, ne - MIN_DURATION_MINUTES);
            } else {
                ne = clamp(ne + snapped, ns + MIN_DURATION_MINUTES, TOTAL_MINUTES);
            }
            setDrafts(prev => ({ ...prev, [drag.entryId]: { start: addMinutes(drag.dayStart, ns), end: addMinutes(drag.dayStart, ne) } }));
            if (ev.clientX < rect.left + 40) container.scrollLeft = Math.max(0, container.scrollLeft - 20);
            else if (ev.clientX > rect.right - 40) container.scrollLeft += 20;
        };
        const handleUp = () => { dragRef.current = null; setIsDragging(false);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp); };
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        return () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp); };
    }, [isDragging]);
 
    const beginDrag = (ev: React.PointerEvent, bar: Bar, kind: DragKind) => {
        setSelectedEntryId(bar.entry.id);
        if (!bar.isEditable || !timelineRef.current) return;
        setSaveError(null); ev.preventDefault();
        dragRef.current = { entryId: bar.entry.id, kind, originClientX: ev.clientX,
            originStartMin: bar.startMin, originEndMin: bar.endMin, pxPerMinute, dayStart };
        setIsDragging(true);
    };
 
    const discardChanges = () => { setDrafts({}); setSaveError(null); };
 
    const handleDelete = async () => {
        if (!deleteEntry) return;
        setIsSubmitting(true); setSaveError(null);
        try {
            const res = await axios.delete(`/admin/tasks/${taskId}/time-entries/${deleteEntry.id}`);
            const updated: TimeEntry[] = res.data.time_entries ?? [];
            setEntries(updated); onChange?.(updated);
            setDrafts(prev => { const n = { ...prev }; delete n[deleteEntry.id]; return n; });
            setDeleteEntry(null);
        } catch (error: unknown) {
            const message = axios.isAxiosError<{ message?: string }>(error)
                ? error.response?.data?.message
                : null;

            setSaveError(message || 'Failed to delete.');
        }
        finally { setIsSubmitting(false); }
    };
 
    const handleSave = async () => {
        if (!isDirty) return;
        setIsSubmitting(true); setSaveError(null);
        try {
            const payload = Object.entries(drafts).map(([id, v]) => ({
                id: Number(id), start_time: v.start.toISOString(), end_time: v.end.toISOString() }));
            const res = await axios.patch(`/admin/tasks/${taskId}/time-entries/batch`, { entries: payload });
            const updated: TimeEntry[] = res.data.time_entries ?? [];
            setEntries(updated); onChange?.(updated); setDrafts({});
        } catch (error: unknown) {
            const message = axios.isAxiosError<{ message?: string }>(error)
                ? error.response?.data?.message
                : null;

            setSaveError(message || 'Failed to save.');
        }
        finally { setIsSubmitting(false); }
    };
 
    const handleCreateManual = async () => {
        const start = parseDateTimeLocal(addStart); const end = parseDateTimeLocal(addEnd);
        if (!start || !end) { setSaveError('Provide valid start and end times.'); return; }
        if (end <= start)   { setSaveError('End must be after start.'); return; }
        const now = new Date();
        if (start > now || end > now) { setSaveError('Start and end times cannot be in the future.'); return; }

        const overlapsExisting = entries.some(entry => {
            const draft = drafts[entry.id];
            const existingStart = draft?.start ?? new Date(entry.start_time);
            const existingEnd = draft?.end ?? (entry.end_time ? new Date(entry.end_time) : now);

            if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) {
                return false;
            }

            return start < existingEnd && end > existingStart;
        });

        if (overlapsExisting) {
            setSaveError('Time entry overlaps with an existing time entry.');
            return;
        }
        setIsSubmitting(true); setSaveError(null);
        try {
            const res = await axios.post(`/admin/tasks/${taskId}/time-entries/manual`,
                { start_time: start.toISOString(), end_time: end.toISOString(), description: addDescription || null });
            const created: TimeEntry | null = res.data.time_entry ?? null;
            if (created) {
                const next = [created, ...entries].sort((a,b) =>
                    new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                setEntries(next); onChange?.(next); setSelectedDate(new Date(created.start_time));
            }
            setIsAddOpen(false); setAddStart(''); setAddEnd(''); setAddDescription('');
        } catch (error: unknown) {
            const message = axios.isAxiosError<{ message?: string }>(error)
                ? error.response?.data?.message
                : null;

            setSaveError(message || 'Failed to create.');
        }
        finally { setIsSubmitting(false); }
    };

    const titleDate = useMemo(() => format(selectedDate, 'dd MMM yyyy'), [selectedDate]);
 
    const selectedEntryDetails = useMemo(() => {
        if (!selectedEntry) return null;
        const draft = drafts[selectedEntry.id];
        const start = draft?.start ?? new Date(selectedEntry.start_time);
        const end   = draft?.end   ?? (selectedEntry.end_time ? new Date(selectedEntry.end_time) : null);
        return { entry: selectedEntry, start, end,
            durationLabel: formatDurationMs((end ?? new Date()).getTime() - start.getTime()),
            isDraft: Boolean(draft) };
    }, [drafts, selectedEntry]);
 
    /* ─── render ─── */
    return (
        <Card className='gap-2' style={{ borderRadius: 12, boxShadow: 'none', border: '0.5px solid var(--color-border-tertiary)' }}>
            {/* ── header ── */}
            <CardHeader style={{ padding: '12px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}
                className="flex flex-row items-center justify-between space-y-0">
                <CardTitle style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em' }}>
                    Time Entries
                </CardTitle>
 
                <div className="flex flex-wrap items-center gap-1.5">
                    {/* date nav */}
                    <Button variant="outline" size="sm" style={{ height: 28, width: 28, padding: 0, borderRadius: 6 }}
                        onClick={() => setSelectedDate(p => addDays(p, -1))} disabled={isSubmitting}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Input type="date" value={toDateInputValue(selectedDate)}
                        onChange={ev => {
                            const [y,m,d] = ev.target.value.split('-').map(Number);
                            if (y && m && d) setSelectedDate(new Date(y, m-1, d));
                        }}
                        style={{ height: 28, width: 136, fontSize: 12, borderRadius: 6, fontWeight: 500 }}
                        disabled={isSubmitting} />
                    <Button variant="outline" size="sm" style={{ height: 28, width: 28, padding: 0, borderRadius: 6 }}
                        onClick={() => setSelectedDate(p => addDays(p, 1))} disabled={isSubmitting}>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
 
                    <Separator orientation="vertical" className="h-5 mx-0.5" />
 
                    <Button variant="outline" size="sm" style={{ height: 28, fontSize: 12, borderRadius: 6 }}
                        onClick={() => setIsAddOpen(true)} disabled={isSubmitting}>
                        <Plus className="h-3.5 w-3.5" /><span className="ml-1.5">Manual Entry</span>
                    </Button>
                </div>
            </CardHeader>
 
            {/* ── body ── */}
            <CardContent style={{ padding: '14px 18px' }} className="space-y-2.5">
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    {titleDate} · Drag to move, resize edges to adjust (completed entries only).
                </div>
 
                {saveError && (
                    <div style={{ borderRadius: 6, border: '0.5px solid #fca5a5', background: '#fef2f2',
                        padding: '8px 12px', fontSize: 12, color: '#b91c1c' }}>
                        {saveError}
                    </div>
                )}
 
                {selectedEntryDetails && (
                    <div style={{ borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)',
                        background: 'var(--color-background-secondary)', padding: '10px 12px', fontSize: 12 }}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                Entry #{selectedEntryDetails.entry.id}
                                {selectedEntryDetails.isDraft ? ' · Unsaved changes' : ''}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button variant="outline" size="sm"
                                    onClick={discardChanges} disabled={!isDirty || isSubmitting}
                                    style={{ height: 26, fontSize: 11, borderRadius: 5 }}>
                                    <RotateCcw className="h-3 w-3" /><span className="ml-1">Discard</span>
                                </Button>
                                <Button size="sm" onClick={handleSave} disabled={!isDirty || isSubmitting}
                                    style={{ height: 26, fontSize: 11, borderRadius: 5,
                                        background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
                                        border: 'none' }}>
                                    <Save className="h-3 w-3" /><span className="ml-1">Save</span>
                                </Button>

                                {!selectedEntryDetails.entry.is_active && selectedEntryDetails.entry.end_time && (
                                    <>
                                        <Separator orientation="vertical" className="h-5 mx-0.5" />
                                        <Button size="sm" onClick={() => setSelectedEntryId(null)} disabled={isSubmitting}
                                            style={{ height: 26, fontSize: 11, borderRadius: 5 }}>
                                            <XIcon className="h-3 w-3" /><span className="ml-1">Close</span>
                                        </Button>
                                        <Button variant="destructive" size="sm"
                                            onClick={() => setDeleteEntry(selectedEntryDetails.entry)} disabled={isSubmitting}
                                            style={{ height: 26, fontSize: 11, borderRadius: 5 }}>
                                            <Trash className="h-3 w-3" /><span className="ml-1">Delete</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <MonoBadge>Start: {format(selectedEntryDetails.start, 'dd MMM yyyy HH:mm:ss')}</MonoBadge>
                            <MonoBadge>End: {selectedEntryDetails.end
                                ? format(selectedEntryDetails.end, 'dd MMM yyyy HH:mm:ss') : 'Active'}</MonoBadge>
                            <MonoBadge variant="outline">Duration: {selectedEntryDetails.durationLabel}</MonoBadge>
                        </div>
                        {selectedEntryDetails.entry.description && (
                            <div style={{ marginTop: 4, color: 'var(--color-text-tertiary)' }}>
                                {selectedEntryDetails.entry.description}
                            </div>
                        )}
                    </div>
                )}
 
                {/* ── timeline ── */}
                <div ref={timelineRef}
                    style={{ borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)',
                        background: 'var(--color-background-secondary)', padding: 8, overflowX: 'auto' }}>
                    <div style={{ position: 'relative', width: widthPx, height: lanesCount * 56, minHeight: 56 }}>
                        {gridHours.map(h => (
                            <div key={h} style={{ position: 'absolute', top: 0, left: h * HOUR_WIDTH,
                                height: '100%', borderLeft: '0.5px dashed var(--color-border-tertiary)' }}>
                                <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--color-text-tertiary)',
                                    paddingTop: 2, paddingLeft: 2, userSelect: 'none' }}>
                                    {String(h).padStart(2,'0')}:00
                                </div>
                            </div>
                        ))}

                        {nowMinute !== null && (
                            <div
                                aria-hidden
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: nowMinute * pxPerMinute,
                                    height: '100%',
                                    width: 0,
                                    zIndex: 25,
                                    pointerEvents: 'none',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: -1,
                                        height: '100%',
                                        width: 2,
                                        background: '#ef4444',
                                        boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.25)',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 2,
                                        left: 6,
                                        fontSize: 9,
                                        fontWeight: 600,
                                        color: '#ef4444',
                                        background: 'rgba(15, 15, 23, 0.85)',
                                        border: '0.5px solid rgba(239, 68, 68, 0.35)',
                                        padding: '1px 5px',
                                        borderRadius: 999,
                                        letterSpacing: '0.01em',
                                        userSelect: 'none',
                                    }}
                                >
                                    Now
                                </div>
                            </div>
                        )}
 
                        {bars.length === 0 && (
                            <div className="flex h-full items-center justify-center"
                                style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                                No time entries for this date.
                            </div>
                        )}
 
                        {bars.map(bar => {
                            const left  = bar.startMin * pxPerMinute;
                            const width = (bar.endMin - bar.startMin) * pxPerMinute;
                            const top   = bar.lane * 56 + 20;
                            const dStart = addMinutes(dayStart, bar.startMin);
                            const dEnd   = addMinutes(dayStart, bar.endMin);
                            const label  = `${format(dStart,'HH:mm')}–${format(dEnd,'HH:mm')}`;
 
                            return (
                                <div key={bar.entry.id} onClick={() => setSelectedEntryId(bar.entry.id)}
                                    title={`${label}${bar.entry.user?.name ? ' · ' + bar.entry.user.name : ''}`}
                                    style={{ position: 'absolute', left, width, top, height: 36, borderRadius: 5,
                                        background: bar.isEditable ? '#1a1a2e' : '#2d2d3a',
                                        border: '0.5px solid #3a3a5c', boxShadow: 'none' }}>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex',
                                        alignItems: 'center', paddingLeft: 8, fontSize: 11, fontWeight: 500,
                                        color: bar.isEditable ? '#a0b4f0' : '#7070a0',
                                        cursor: bar.isEditable ? 'move' : 'not-allowed', overflow: 'hidden' }}
                                        onPointerDown={ev => beginDrag(ev, bar, 'move')}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {label}
                                        </span>
                                    </div>
                                    {bar.isEditable && <>
                                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 6,
                                            cursor: 'ew-resize', background: '#3a3a6a', borderRadius: '5px 0 0 5px' }}
                                            onPointerDown={ev => beginDrag(ev, bar, 'resize-start')} />
                                        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 6,
                                            cursor: 'ew-resize', background: '#3a3a6a', borderRadius: '0 5px 5px 0' }}
                                            onPointerDown={ev => beginDrag(ev, bar, 'resize-end')} />
                                    </>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
 
            {/* ── add dialog ── */}
            <Modal
                opened={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Add Manual Time Entry"
                size="lg"
                closeOnClickOutside={!isSubmitting}
                closeOnEscape={!isSubmitting}
            >
                <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    Add a completed entry (start + end).
                </div>
                    <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="v1-start">Start</Label>
                        <Input id="v1-start" type="datetime-local" value={addStart}
                            max={maxDateTimeLocal}
                            onChange={e => setAddStart(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="v1-end">End</Label>
                        <Input id="v1-end" type="datetime-local" value={addEnd}
                            max={maxDateTimeLocal}
                            onChange={e => setAddEnd(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="v1-desc">Description (optional)</Label>
                        <Input id="v1-desc" value={addDescription}
                            onChange={e => setAddDescription(e.target.value)} disabled={isSubmitting} />
                    </div>
                    {saveError && (
                        <div style={{ borderRadius: 6, border: '0.5px solid #fca5a5', background: '#fef2f2',
                            padding: '8px 12px', fontSize: 12, color: '#b91c1c' }}>{saveError}</div>
                    )}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleCreateManual} disabled={isSubmitting}
                        style={{ background: 'var(--color-text-primary)', color: 'var(--color-background-primary)', border: 'none' }}>
                        Create
                    </Button>
                </div>
            </Modal>
 
            {/* ── delete dialog ── */}
            <Modal
                opened={deleteEntry !== null}
                onClose={() => setDeleteEntry(null)}
                title="Delete Time Entry"
                size="md"
                centered
                closeOnClickOutside={!isSubmitting}
                closeOnEscape={!isSubmitting}
            >
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    This will remove the time entry from this task.
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleteEntry(null)} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
                </div>
            </Modal>
        </Card>
    );
}
