import { Task, TaskForwardingRecord, TaskForwardingWaterfallStep } from '@/types';

function normalizeTimestamp(input?: string | null): number {
    if (!input) {
        return 0;
    }

    const parsed = new Date(input).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
}

function resolveForwardingSource(forwarding: TaskForwardingRecord): string {
    return (
        forwarding.from_user?.name ??
        forwarding.forwarded_by?.name ??
        forwarding.from_department?.name ??
        'Unknown source'
    );
}

function resolveForwardingTarget(forwarding: TaskForwardingRecord): string {
    return (
        forwarding.to_user?.name ??
        forwarding.to_department?.name ??
        'Unknown target'
    );
}

export function buildForwardingWaterfall(task: Task): TaskForwardingWaterfallStep[] {
    if (Array.isArray(task.forwarding_waterfall) && task.forwarding_waterfall.length > 0) {
        return task.forwarding_waterfall;
    }

    const rawForwardings = Array.isArray(task.forwardings) ? task.forwardings : [];

    if (rawForwardings.length === 0) {
        return [];
    }

    return [...rawForwardings]
        .sort((left, right) => {
            const leftTs = normalizeTimestamp(left.forwarded_at ?? left.created_at ?? null);
            const rightTs = normalizeTimestamp(right.forwarded_at ?? right.created_at ?? null);

            return leftTs - rightTs;
        })
        .map((forwarding) => ({
            id: forwarding.id,
            from_label: resolveForwardingSource(forwarding),
            to_label: resolveForwardingTarget(forwarding),
            from_user: forwarding.from_user?.name ?? null,
            to_user: forwarding.to_user?.name ?? null,
            from_department: forwarding.from_department?.name ?? null,
            to_department: forwarding.to_department?.name ?? null,
            status: forwarding.status,
            forwarded_at: forwarding.forwarded_at ?? forwarding.created_at ?? null,
        }));
}

export function isTaskForwarded(task: Task): boolean {
    if (typeof task.has_forwardings === 'boolean') {
        return task.has_forwardings;
    }

    if (typeof task.forwardings_count === 'number') {
        return task.forwardings_count > 0;
    }

    return buildForwardingWaterfall(task).length > 0;
}
