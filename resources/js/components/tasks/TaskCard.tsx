import { Task } from "@/types";
import { useDisclosure } from "@mantine/hooks";
import { useDrag } from "react-dnd";
import TaskTimeTracker from "./TaskTimeTracker";
import { Modal, Menu, MenuTarget, MenuDropdown, MenuItem } from "@mantine/core";
import { Eye, Forward, MessageSquare, History, AlertTriangle, GitBranch } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useTimeTracking } from "@/context/TimeTrackingContext";
import TaskComments from "./task-comments";
import { isTaskForwarded } from "@/lib/taskForwarding";
import TaskForwarding from "./TaskForwarding";
import TaskHistories from "./TaskHistories";

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

    const [{ isDragging }, drag] = useDrag({
        type: 'TASK',
        item: { id: task.id, status: task.state },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult<{ status: string }>();
            if (item && dropResult && item.status !== dropResult.status) {
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
    const othersTrackingCount = Number(task.other_active_users_count ?? 0);
    const forwarded = isTaskForwarded(task);

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
                        ref={(node) => {
                            drag(node);
                        }}
                        className={`${isActive ? 'bg-green-200' : 'bg-white'} p-3 mb-2 rounded-lg shadow-sm border relative cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
                    >
                        <div className="flex justify-between">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <p className="font-medium text-sm">{task.title}</p>
                                    {forwarded && (
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700"
                                            title="Forwarded task"
                                            aria-label="Forwarded task"
                                        >
                                            <GitBranch className="h-3 w-3" />
                                            Forwarded
                                        </span>
                                    )}
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
                                {othersTrackingCount > 0 && (
                                    <div className="inline-flex items-center gap-1 mt-2 ml-2 px-2 py-0.5 rounded-full text-xs font-medium border bg-sky-100 text-sky-700 border-sky-200">
                                        {othersTrackingCount} other{othersTrackingCount > 1 ? 's' : ''} tracking
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2"></div>
                        </div>
                        <TaskTimeTracker
                            taskId={task.id}
                            taskState={task.state}
                            initialTask={task}
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
                        Forward
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
                title="Forward Task"
            >
                {forwardingOpened ? <TaskForwarding task={task}/> : null}
            </Modal>

            {/* Comments Modal */}
            <Modal
                opened={commentsOpened}
                onClose={closeComments}
                size={'lg'}
                title="Task Comments"
            >
                {commentsOpened ? <TaskComments taskId={task.id} /> : null}
            </Modal>

            {/* Histories Modal */}
            <Modal
                opened={historiesOpened}
                onClose={closeHistories}
                size={'lg'}
                title="Task History"
            >
                {historiesOpened ? <TaskHistories task={task} /> : null}
            </Modal>
        </>
    );
};

export default TaskCard;
