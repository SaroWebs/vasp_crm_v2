import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Auth } from "@/types";
import { CheckCircle, Clock, TicketIcon } from 'lucide-react';
import WizCardDesign1 from "../wizards/WizCardDesign1";
import { useEffect, useState } from "react";
import RecentTicketsWidget from "../dashboard/widgets/RecentTicketsWidget";
import DailyAttendancePanel from "../admin/employees/DailyAttendancePanel";
import RecentReportSection from "../reports/RecentReportSection";
import TaskTimeline from "../admin/TaskTimeline";

interface AdminScreenProps {
    auth?: Auth | null;
}

const AdminScreen = ({ auth }: AdminScreenProps) => {
    const { stats: dashboardStats } = useDashboardStats(auth?.user?.id);
    const [showSecondaryWidgets, setShowSecondaryWidgets] = useState(false);


    const statNumber = (key: string): number => {
        const value = dashboardStats[key];
        return typeof value === 'number' ? value : 0;
    };
    const wizCards = [
        {
            title: 'Open Tickets',
            text: 'All active tickets',
            stats: statNumber('open_tickets'),
            icon: TicketIcon,
            color: 'orange',
            link: '/admin/tickets?status=open',
        },
        {
            title: 'Closed Today',
            text: 'Tickets closed today',
            stats: statNumber('tickets_closed_today'),
            icon: CheckCircle,
            color: 'blue',
            link: '/admin/tickets?status=closed',
        },
        {
            title: 'Pending Tasks',
            text: 'All pending tasks',
            stats: statNumber('pending_tasks'),
            icon: Clock,
            color: 'purple',
            link: '/admin/tasks?status=pending',
        },
        {
            title: 'Completed Today',
            text: 'Tasks completed today',
            stats: statNumber('tasks_completed_today'),
            icon: CheckCircle,
            color: 'green',
            link: '/admin/tasks?status=completed',
        },
    ] as const;


    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setShowSecondaryWidgets(true);
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <div className="">
            <div className="grid gap-4 md:grid-cols-8">
                <div className="md:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {wizCards.map((wizCard) => (
                            <WizCardDesign1
                                key={wizCard.title}
                                title={wizCard.title}
                                text={wizCard.text}
                                stats={wizCard.stats}
                                icon={wizCard.icon}
                                color={wizCard.color}
                                link={wizCard.link}
                            />
                        ))}
                    </div>
                </div>
                {showSecondaryWidgets && (
                    <>
                        <div className="md:col-span-8 space-y-4">
                            <RecentTicketsWidget />
                        </div>
                        <div className="md:col-span-8 space-y-4">
                            <DailyAttendancePanel />
                            <RecentReportSection />
                        </div>
                        <div className="md:col-span-8 space-y-4">
                            <TaskTimeline />
                        </div>
                    </>
                )}
            </div>
        
        </div >
    );
}

export default AdminScreen;