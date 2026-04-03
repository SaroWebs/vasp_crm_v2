import { Task, TaskHistory } from "@/types";
import { useDisclosure } from "@mantine/hooks";
import { useDrag } from "react-dnd";
import TaskTimeTracker from "./TaskTimeTracker";
import { Modal, Menu, MenuTarget, MenuDropdown, MenuItem, Badge } from "@mantine/core";
import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, Forward, MessageSquare, History, AlertTriangle } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useTimeTracking } from "@/context/TimeTrackingContext";
import TaskComments from "./task-comments";
import { HolidaysConfig, WorkingHoursConfig, isWithinWorkingHours } from "@/utils/workingHours";

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

const priorityConfig = {
    P1: {
        label: 'Critical',
        dotClass: 'bg-red-500',
    },
    P2: {
        label: 'High',
        dotClass: 'bg-orange-500',
    },
    P3: {
        label: 'Medium',
        dotClass: 'bg-amber-500',
    },
    P4: {
        label: 'Low',
        dotClass: 'bg-emerald-500',
    },
} as const;

const getPriorityConfig = (priority?: string | null) => {
    const normalizedPriority = priority?.toUpperCase();

    if (
        normalizedPriority &&
        normalizedPriority in priorityConfig
    ) {
        return priorityConfig[normalizedPriority as keyof typeof priorityConfig];
    }

    return priorityConfig.P4;
};

type TaskForwardingRecord = {
    id: number;
    from_department?: {
        name?: string | null;
    } | null;
    to_department?: {
        name?: string | null;
    } | null;
    status?: string;
    created_at: string;
    reason?: string | null;
    notes?: string | null;
    forwarded_by_user?: {
        name?: string | null;
    } | null;
};

// Component definitions moved before TaskCard to avoid hoisting issues
const TaskForwarding = ({ task}: { task: Task }) => {
    const [forwardings, setForwardings] = useState<TaskForwardingRecord[]>([]);
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
}> = ({ task, moveTask, onTaskAction, id }) => {
    const [forwardingOpened, { open: openForwarding, close: closeForwarding }] = useDisclosure(false);
    const [commentsOpened, { open: openComments, close: closeComments }] = useDisclosure(false);
    const [historiesOpened, { open: openHistories, close: closeHistories }] = useDisclosure(false);
    const [workingHoursConfig, setWorkingHoursConfig] = useState<WorkingHoursConfig | null>(null);
    const [holidaysConfig, setHolidaysConfig] = useState<HolidaysConfig | null>(null);
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

    const isWorkingTime = () => {
        if (!configLoaded) {
            return true;
        }

        return isWithinWorkingHours(new Date(), workingHoursConfig, holidaysConfig);
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
    const priorityValue = task.sla_policy?.priority ?? "P4";
    const priorityConfigValue = getPriorityConfig(priorityValue);

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
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <p className="font-medium text-sm">{task.title}</p>
                                    {priorityValue && (
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600"
                                            title={`SLA priority: ${priorityConfigValue.label}`}
                                            aria-label={`SLA priority: ${priorityConfigValue.label}`}
                                        >
                                            <span
                                                className={`h-2 w-2 rounded-full ${priorityConfigValue.dotClass}`}
                                            />
                                            {priorityConfigValue.label}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{task.task_code}</p>
                                {/* Overdue Time Display */}
                                {task.overdue_time && task.state !== 'Done' && task.state !== 'Cancelled' && task.state !== 'Rejected' && (
                                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
                                        <AlertTriangle className="h-3 w-3" />
                                        {task.overdue_time}
                                    </div>
                                )}
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
                        component={Link}
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
                <TaskForwarding task={task}/>
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
