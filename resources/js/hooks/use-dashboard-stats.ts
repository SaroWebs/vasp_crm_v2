import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { stats as dashboardStatsRoute } from '@/routes/admin/api/dashboard';

type DashboardStatsValue = number | Record<string, number>;
type DashboardStats = Record<string, DashboardStatsValue>;

interface DashboardStatsResponse {
    stats?: DashboardStats;
}

interface UseDashboardStatsResult {
    stats: DashboardStats;
    loading: boolean;
    refresh: () => Promise<void>;
}

export function useDashboardStats(userId?: number | string | null): UseDashboardStatsResult {
    const [stats, setStats] = useState<DashboardStats>({});
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!userId) {
            setStats({});
            return;
        }

        setLoading(true);

        try {
            const response = await axios.request<DashboardStatsResponse>(
                dashboardStatsRoute(),
            );
            setStats(response.data.stats ?? {});
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        if (!userId) {
            return;
        }

        if (typeof window === 'undefined' || !window.Echo) {
            const intervalId = window.setInterval(() => {
                void refresh();
            }, 30000);

            return () => window.clearInterval(intervalId);
        }

        const channelName = `dashboard.${userId}`;
        const channel = window.Echo.private(channelName);

        channel.listen('.dashboard.data.changed', () => {
            void refresh();
        });

        return () => {
            window.Echo?.leave(channelName);
        };
    }, [refresh, userId]);

    return useMemo(
        () => ({
            stats,
            loading,
            refresh,
        }),
        [loading, refresh, stats],
    );
}
