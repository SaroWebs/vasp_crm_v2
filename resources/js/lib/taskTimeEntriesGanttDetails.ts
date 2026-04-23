export function formatDurationMs(durationMs: number): string {
    const safeMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
    const totalSeconds = Math.floor(safeMs / 1000);

    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }

    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (totalMinutes < 60) {
        return seconds > 0 ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

