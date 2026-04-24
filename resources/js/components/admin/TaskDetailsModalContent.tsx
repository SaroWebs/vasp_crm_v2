import { Task, TaskAttachment, TaskComment } from '@/types';
import { Link } from '@inertiajs/react';

interface TaskDetailsModalContentProps {
    task: Task | null;
    attachments: TaskAttachment[];
    comments: TaskComment[];
    loading: boolean;
    errorMessage: string | null;
}

function formatDateTime(date?: string | null): string {
    if (!date) {
        return 'Date not set';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return 'Date not set';
    }

    return parsed.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function resolvePersonName(person: unknown, fallback: string): string {
    if (!person) {
        return fallback;
    }

    if (typeof person === 'string') {
        return person;
    }

    if (typeof person === 'number') {
        return `User #${person}`;
    }

    if (typeof person === 'object' && 'name' in person) {
        return String((person as { name?: string }).name || fallback);
    }

    return fallback;
}

export default function TaskDetailsModalContent({
    task,
    attachments,
    comments,
    loading,
    errorMessage,
}: TaskDetailsModalContentProps) {
    if (loading) {
        return (
            <div
                style={{
                    padding: 24,
                    textAlign: 'center',
                    color: '#667085',
                    fontSize: 13,
                }}
            >
                Loading task details...
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div
                style={{
                    padding: 24,
                    textAlign: 'center',
                    color: '#b42318',
                    fontSize: 13,
                }}
            >
                {errorMessage}
            </div>
        );
    }

    if (!task) {
        return (
            <div
                style={{
                    padding: 24,
                    textAlign: 'center',
                    color: '#667085',
                    fontSize: 13,
                }}
            >
                Task details are not available.
            </div>
        );
    }

    const assignedUsers = task.assigned_users ?? [];

    const assignedBy =
        (task as { assigned_by_user?: unknown }).assigned_by_user ??
        (task as { assignedByUser?: unknown }).assignedByUser ??
        task.created_by ??
        task.createdBy ??
        null;
    const assignedByName = assignedBy
        ? assignedUsers.some((user) => {
            if (
                typeof assignedBy === 'object' &&
                assignedBy !== null &&
                'id' in assignedBy
            ) {
                return (assignedBy as { id?: number }).id === user.id;
            }

            if (typeof assignedBy === 'number') {
                return assignedBy === user.id;
            }

            if (typeof assignedBy === 'string') {
                return assignedBy === user.name;
            }

            return false;
        })
            ? 'Self'
            : resolvePersonName(assignedBy, 'Unknown')
        : 'Unassigned';
    const priority = task.priority ? task.priority.toUpperCase() : 'low';
    const status = task.state?.replace('_', ' ') ?? 'Unknown';
    const taskViewUrl = `/admin/tasks/${task.id}`;
    const taskEditUrl = `/admin/tasks/${task.id}/edit`;

    return (
        <div className='flex flex-col gap-3 max-h-[300px] overflow-y-auto px-4 py-3'>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: '#98A2B3',
                            fontWeight: 600,
                        }}
                    >
                        {task.task_code || `Task #${task.id}`}
                    </div>
                    <div
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#101828',
                            marginTop: 4,
                        }}
                    >
                        {task.title || 'Untitled task'}
                    </div>
                </div>

                <div className='flex gap-2 flex-wrap'>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: '#e7f1ff',
                            color: '#185fa5',
                        }}
                    >
                        {status}
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: '#fff4e6',
                            color: '#a04a00',
                        }}
                    >
                        {priority}
                    </span>
                </div>
            </div>

            {task.description ? (
                <div>
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#667085',
                        }}
                    >
                        Description
                    </div>
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 13,
                            color: '#344054',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {task.description}
                    </div>
                </div>
            ) : null}
            <div>
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#667085',
                        marginBottom: 8,
                    }}
                >
                    Operations
                </div>
                <div className='flex gap-2 flex-wrap'>
                    <Link
                        href={taskViewUrl}
                        className='inline-flex items-center rounded-md border border-[#d0d5dd] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb]'
                    >
                        View Task
                    </Link>
                    {task.can_manage_task ? (
                        <Link
                            href={taskEditUrl}
                            className='inline-flex items-center rounded-md border border-[#b2ddff] bg-[#eff8ff] px-3 py-1.5 text-xs font-semibold text-[#175cd3] hover:bg-[#d1e9ff]'
                        >
                            Edit Task
                        </Link>
                    ) : null}
                </div>
            </div>
            <div className="flex justify-between">
                <div>
                    <div className='flex gap-2'>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#667085',
                            }}
                        >
                            Assigned By : 
                        </div>
                        <div
                            style={{ fontSize: 13, color: '#344054' }}
                        >
                            {assignedByName}
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#667085',
                            }}
                        >
                            Assigned To : 
                        </div>
                        <div
                            style={{ fontSize: 13, color: '#344054' }}
                        >
                            {assignedUsers.length > 0
                                ? assignedUsers.map((user) => user.name).join(', ')
                                : 'Unassigned'}
                        </div>
                    </div>
                    {task.assigned_department ? (
                        <div>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#667085',
                                }}
                            >
                                Department
                            </div>
                            <div
                                style={{
                                    marginTop: 4,
                                    fontSize: 13,
                                    color: '#344054',
                                }}
                            >
                                {task.assigned_department.name}
                            </div>
                        </div>
                    ) : null}
                </div>
                <div>
                    <div className='flex gap-2'>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#667085',
                            }}
                        >
                            Start :
                        </div>
                        <div
                            style={{ fontSize: 13, color: '#344054' }}
                        >
                            {formatDateTime(task.start_at)}
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#667085',
                            }}
                        >
                            Due :
                        </div>
                        <div
                            style={{ fontSize: 13, color: '#344054' }}
                        >
                            {formatDateTime(task.due_at)}
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#667085',
                            }}
                        >
                            Estimate
                        </div>
                        <div
                            style={{ fontSize: 13, color: '#344054' }}
                        >
                            {task.estimate_hours
                                ? `${task.estimate_hours}h`
                                : 'Not set'}
                        </div>
                    </div>
                </div>
            </div>


            <div
                style={{
                    borderTop: '1px solid #eaecf0',
                    paddingTop: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#667085',
                            marginBottom: 8,
                        }}
                    >
                        Attachments ({attachments.length})
                    </div>
                    {attachments.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#98A2B3' }}>
                            No attachments.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                        >
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        border: '1px solid #e4e7ec',
                                        background: '#f8fafc',
                                        fontSize: 12,
                                        color: '#344054',
                                    }}
                                >
                                    {attachment.file_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#667085',
                            marginBottom: 8,
                        }}
                    >
                        Comments ({comments.length})
                    </div>
                    {comments.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#98A2B3' }}>
                            No comments yet.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}
                        >
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #e4e7ec',
                                        background: '#ffffff',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: '#344054',
                                        }}
                                    >
                                        {comment.commenter?.name || 'Unknown'}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: '#98A2B3',
                                            marginTop: 2,
                                        }}
                                    >
                                        {formatDateTime(comment.created_at)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: '#475467',
                                            marginTop: 6,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {comment.comment_text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
