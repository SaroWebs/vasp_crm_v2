import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Auth } from "@/types";
import WizCardDesign1 from "../wizards/WizCardDesign1";
import { AlertCircle, Calendar, CheckCircle, Clock } from "lucide-react";

interface EmployeeScreenProps{
    auth?: Auth | null;
}
const EmployeeScreen = ({auth}:EmployeeScreenProps) => {

    const { stats } = useDashboardStats(auth?.user?.id);
    const wizData = [
        {
            title: "Due Today",
            text: "",
            stats: Number(stats?.tasks_due_today || 0),
            icon: Calendar,
            color: 'orange',
            link: '/my/tasks?filter=pending&due=today'
        },
        {
            title: "Overdue",
            text: "",
            stats: Number(stats?.overdue_tasks || 0),
            icon: AlertCircle,
            color: 'red',
            link: '/my/tasks?filter=pending'
        },
        {
            title: "In Progress",
            text: "",
            stats: Number(stats?.in_progress_tasks || 0),
            icon: Clock,
            color: 'blue',
            link: '/my/tasks?filter=in_progress'
        },
        {
            title: "Completed This Month",
            text: "",
            stats: Number(stats?.completed_this_month || 0),
            icon: CheckCircle,
            color: 'green',
            link: '/my/tasks?filter=done'
        }
    ] as const;
    return(
        <div className="">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {wizData.map((card, index) => (
                    <WizCardDesign1
                        key={index}
                        title={card.title}
                        text={card.text}
                        stats={card.stats}
                        icon={card.icon}
                        color={card.color}
                        link={card.link}
                    />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                
            </div>
        </div>
    );
}

export default EmployeeScreen;