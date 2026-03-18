import { Task, TaskHistory } from "@/types";
import { useDisclosure } from "@mantine/hooks";
import { useDrag } from "react-dnd";
import TaskTimeTracker from "./TaskTimeTracker";
import { Modal, Menu, MenuTarget, MenuDropdown, MenuItem, Badge } from "@mantine/core";
import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, Forward, MessageSquare, History, MessageCircleMore, Clock, AlertTriangle } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useTimeTracking } from "@/context/TimeTrackingContext";
import TaskComments from "./task-comments";

const statusColorMap: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Assigned: 'bg-blue-100 text-blue-700',
    InProgress: 'bg-indigo-100 text-indigo-700',
    Blocked: 'bg-red-100 text-red-700',
    InReview: 'bg-amber-100 text-amber-700',
    Done: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-slate-100 text-slate-700',
    Rejected: 'bg-rose-100 text-rose-700',
};

// Calculate overdue time and return formatted string
const getOverdueTime = (dueAt: string | null | undefined): { text: string; isOverdue: boolean; className: string } | null => {
    if (!dueAt) return null;
    
    const now = new Date();
    const dueDate = new Date(dueAt);
    const diffMs = now.getTime() - dueDate.getTime();
    
    // If not overdue (due date is in the future)
    if (diffMs < 0) return null;
    
    // Calculate different time units
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let text: string;
    let className: string;
    
    if (diffDays >= 1) {
        text = `${diffDays}d overdue`;
        className = 'bg-red-100 text-red-700 border-red-200';
    } else if (diffHours >= 1) {
        text = `${diffHours}h overdue`;
        className = 'bg-orange-100 text-orange-700 border-orange-200';
    } else {
        text = `${diffMinutes}m overdue`;
        className = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    
    return { text, isOverdue: true, className };
};

// Component definitions moved before TaskCard to avoid hoisting issues
const TaskForwarding = ({ task, onClose }: { task: Task; onClose: () => void }) => {
    const [forwardings, setForwardings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchForwardings = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/data/tasks/${task.id}/forwardings`);
                setForwardings(response.data?.data || response.data || []);
            } catch (error) {
                console.error('Error fetching forwardings:', error);
            } finally {
                setLoading(false);
            }
        };

        if (task.id) {
            fetchForwardings();
        }
    }, [task.id]);

    if (loading) {
        return <div className="text-center py-8">Loading forwardings...</div>;
    }

    return (
        <div className="space-y-4">
            {forwardings.length > 0 ? (
                forwardings.map((forwarding) => (
                    <div key={forwarding.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                    {forwarding.from_department?.name || 'Unknown'} → {forwarding.to_department?.name || 'Unknown'}
                                </span>
                                <Badge size="sm" variant="light">{forwarding.status}</Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(forwarding.created_at).toLocaleString()}
                            </div>
                        </div>
                        {forwarding.reason && (
                            <div className="mt-2 text-sm text-gray-700">
                                <strong>Reason:</strong> {forwarding.reason}
                            </div>
                        )}
                        {forwarding.notes && (
                            <div className="mt-1 text-xs text-gray-600">
                                <strong>Notes:</strong> {forwarding.notes}
                            </div>
                        )}
                        {forwarding.forwarded_by_user && (
                            <div className="mt-1 text-xs text-gray-600">
                                Forwarded by: {forwarding.forwarded_by_user.name}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">No forwarding records available</div>
            )}
        </div>
    );
};

const TaskHistories = ({ task }: { task: Task }) => {
    const [histories, setHistories] = useState<TaskHistory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistories = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/data/tasks/${task.id}/history`);
                setHistories(response.data?.data || response.data || []);
            } catch (error) {
                console.error('Error fetching histories:', error);
            } finally {
                setLoading(false);
            }
        };

        if (task.id) {
            fetchHistories();
        }
    }, [task.id]);

    if (loading) {
        return <div className="text-center py-8">Loading history...</div>;
    }

    return (
        <div className="space-y-4">
            {histories.length > 0 ? (
                histories.map((history) => (
                    <div key={history.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                    Status Change
                                </span>
                                <Badge size="sm" variant="light">{history.old_status} → {history.new_status}</Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(history.created_at).toLocaleString()}
                            </div>
                        </div>
                        {history.changed_by_user && (
                            <div className="mt-2 text-sm text-gray-700">
                                Changed by: {history.changed_by_user.name}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">No history available</div>
            )}
        </div>
    );
};

const TaskCard: React.FC<{
    task: Task;
    index: number;
    moveTask: (id: number, newStatus: string) => void;
    onTaskAction?: (action: 'start' | 'resume' | 'pause' | 'end', taskId: number) => void;
    id?: string;
}> = ({ task, index, moveTask, onTaskAction, id }) => {
    const [forwardingOpened, { open: openForwarding, close: closeForwarding }] = useDisclosure(false);
    const [commentsOpened, { open: openComments, close: closeComments }] = useDisclosure(false);
    const [historiesOpened, { open: openHistories, close: closeHistories }] = useDisclosure(false);
    const [workingHoursConfig, setWorkingHoursConfig] = useState<any>(null);
    const [holidaysConfig, setHolidaysConfig] = useState<any>(null);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Fetch working hours and holidays configuration
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get('/api/working-hours-config');
                setWorkingHoursConfig(response.data.data.working_hours);
                setHolidaysConfig(response.data.data.holidays);
                setConfigLoaded(true);
            } catch (err) {
                console.error('Failed to fetch working hours configuration:', err);
                // Fallback to default config if API fails
                setWorkingHoursConfig({
                    workdays: [
                        { day: 'monday', start: '09:00', end: '19:00', break_start: '', break_end: '' },
                        { day: 'tuesday', start: '09:00', end: '19:00', break_start: '', break_end: '' },
                        { day: 'wednesday', start: '09:00', end: '19:00', break_start: '', break_end: '' },
                        { day: 'thursday', start: '09:00', end: '19:00', break_start: '', break_end: '' },
                        { day: 'friday', start: '09:00', end: '19:00', break_start: '', break_end: '' },
                        { day: 'saturday', start: '09:00', end: '14:00', break_start: '', break_end: '' },
                        { day: 'sunday', start: '', end: '', break_start: '', break_end: '' }
                    ],
                    timezone: 'Asia/Calcutta'
                });
                setHolidaysConfig({ holidays: [], year: new Date().getFullYear() });
                setConfigLoaded(true);
            }
        };

        fetchConfig();
    }, []);

    // Check if current time is within working hours
    const isWorkingTime = () => {
        if (!configLoaded || !workingHoursConfig) {
            return true; // Assume working time if config not loaded yet
        }

        const now = new Date();
        const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const workdayConfig = workingHoursConfig.workdays.find((wd: any) => wd.day === dayName);

        // Check if it's a holiday
        const todayStr = now.toISOString().split('T')[0];
        if (holidaysConfig?.holidays.some((holiday: any) => holiday.date === todayStr)) {
            return false;
        }

        // Check if it's a working day
        if (!workdayConfig || !workdayConfig.start || !workdayConfig.end) {
            return false;
        }

        // Convert time to minutes since midnight for easier comparison
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Parse working hours
        const [startHours, startMinutes] = workdayConfig.start.split(':').map(Number);
        const [endHours, endMinutes] = workdayConfig.end.split(':').map(Number);
        
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        // Check if current time is within working hours
        if (currentMinutes < startTotalMinutes || currentMinutes > endTotalMinutes) {
            return false;
        }

        // Check if current time is during break (though users take different break times)
        if (workdayConfig.break_start && workdayConfig.break_end) {
            const [breakStartHours, breakStartMinutes] = workdayConfig.break_start.split(':').map(Number);
            const [breakEndHours, breakEndMinutes] = workdayConfig.break_end.split(':').map(Number);
            
            const breakStartTotalMinutes = breakStartHours * 60 + breakStartMinutes;
            const breakEndTotalMinutes = breakEndHours * 60 + breakEndMinutes;
            
            if (currentMinutes >= breakStartTotalMinutes && currentMinutes <= breakEndTotalMinutes) {
                return false;
            }
        }

        return true;
    };

    const [{ isDragging }, drag] = useDrag({
        type: 'TASK',
        item: { id: task.id, status: task.state },
        canDrag: isWorkingTime,
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult<{ status: string }>();
            if (item && dropResult) {
                moveTask(item.id, dropResult.status);
            }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    // Improved version using context
    const { activeTaskId } = useTimeTracking();
    const isActive = activeTaskId === task.id;


    const statusClass =
        statusColorMap[task.state as keyof typeof statusColorMap] ??
        'bg-gray-100 text-gray-700';

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.mantine-Button-root')) {
            return;
        }
    };

    const handleMenuAction = (action: 'forwarding' | 'comments' | 'histories') => {
        if (action === 'forwarding') {
            openForwarding();
        } else if (action === 'comments') {
            openComments();
        } else if (action === 'histories') {
            openHistories();
        }
    };

    return (
        <>
            <Menu position="bottom-start" offset={-5} withArrow>
                <MenuTarget>
                    <div
                        id={id}
                        onClick={handleCardClick}
                        ref={drag as any}
                        className={`${isActive ? 'bg-green-200' : 'bg-white'} p-3 mb-2 rounded-lg shadow-sm border relative cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
                    >
                        <div className="flex justify-between">
                            <div className="flex-1">
                                <p className="font-medium text-sm pt-2">{task.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{task.task_code}</p>
                                {/* Overdue Time Display */}
                                {(() => {
                                    const overdueInfo = getOverdueTime(task.due_at);
                                    if (overdueInfo && task.state !== 'Done' && task.state !== 'Cancelled' && task.state !== 'Rejected') {
                                        return (
                                            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium border ${overdueInfo.className}`}>
                                                <AlertTriangle className="h-3 w-3" />
                                                {overdueInfo.text}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="flex gap-2"></div>
                        </div>
                        <TaskTimeTracker
                            taskId={task.id}
                            taskState={task.state}
                            onTimeUpdate={() => { }}
                            onTaskAction={onTaskAction}
                        />
                        {(task.state && isActive) && (
                            <>
                                <span
                                    className={`absolute top-1 right-2 inline-flex items-center rounded-full px-2 py-0 text-xs font-medium ${statusClass}`}
                                >
                                    {task.state}
                                </span>
                            </>
                        )}

                    </div>
                </MenuTarget>
                <MenuDropdown>
                    <MenuItem
                        leftSection={<Eye size={16} />}
                        component={Link as any}
                        href={`/my/tasks/${task.id}`}
                    >
                        View
                    </MenuItem>
                    <MenuItem leftSection={<Forward size={16} />} onClick={() => handleMenuAction('forwarding')}>
                        Task Forwarding
                    </MenuItem>
                    <MenuItem leftSection={<MessageSquare size={16} />} onClick={() => handleMenuAction('comments')}>
                        Comments {Number(task?.comments_count ?? 0) > 0 ? `(${Number(task?.comments_count ?? 0)})` : null}
                    </MenuItem>
                    <MenuItem leftSection={<History size={16} />} onClick={() => handleMenuAction('histories')}>
                        Histories
                    </MenuItem>
                </MenuDropdown>
            </Menu>

            {/* Task Forwarding Modal */}
            <Modal
                opened={forwardingOpened}
                onClose={closeForwarding}
                size={'lg'}
                title="Task Forwarding"
            >
                <TaskForwarding task={task} onClose={closeForwarding} />
            </Modal>

            {/* Comments Modal */}
            <Modal
                opened={commentsOpened}
                onClose={closeComments}
                size={'lg'}
                title="Task Comments"
            >
                <TaskComments taskId={task.id} />
            </Modal>

            {/* Histories Modal */}
            <Modal
                opened={historiesOpened}
                onClose={closeHistories}
                size={'lg'}
                title="Task History"
            >
                <TaskHistories task={task} />
            </Modal>
        </>
    );
};

export default TaskCard;
