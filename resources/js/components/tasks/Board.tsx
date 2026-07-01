import React, { useState } from 'react';
import axios from 'axios';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { parseISO, subDays, isAfter } from 'date-fns';
import { Task } from '@/types';
import TaskCreateDrawer from './TaskCreateDrawer';
import TaskCard from './TaskCard';
import { useTimeTracking } from '@/context/TimeTrackingContext';
import { Skeleton } from '@/components/ui/skeleton';

export interface BoardProps {
  tasks: Task[];
  loadTasks: () => void | Promise<void>;
  isLoading?: boolean;
}

const getBoardGroup = (status?: string | null) => {
  if (status === 'Draft' || status === 'Assigned') {
    return 'Pending';
  }

  if (status === 'InProgress' || status === 'Blocked' || status === 'InReview') {
    return 'Active';
  }

  if (status === 'Done' || status === 'Cancelled' || status === 'Rejected') {
    return 'Completed';
  }

  return status ?? '';
};

const TaskColumn: React.FC<{
  status: string;
  tasks: Task[];
  moveTask: (id: number, newStatus: string) => void;
  onTaskAction?: (action: 'start' | 'resume' | 'pause' | 'end', taskId: number) => void;
  activeTaskId: number | null;
}> = ({ status, tasks, moveTask, onTaskAction, activeTaskId }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: () => ({ status }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Define the display name and color for each group
  const getColumnDisplay = (status: string) => {
    switch (status) {
      case 'Draft':
      case 'Assigned':
        return { displayName: 'Pending', color: 'bg-yellow-100' };
      case 'InProgress':
      case 'Blocked':
      case 'InReview':
        return { displayName: 'Active', color: 'bg-blue-100' };
      case 'Done':
      case 'Cancelled':
      case 'Rejected':
        return { displayName: 'Completed', color: 'bg-gray-100' };
      default:
        return { displayName: status, color: 'bg-gray-50' };
    }
  };

  const { displayName, color } = getColumnDisplay(status);

  // Prioritize active task to the top
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.id === activeTaskId) return -1;
    if (b.id === activeTaskId) return 1;
    return 0;
  });

  // Scroll active task into view when it changes
  React.useEffect(() => {
    if (activeTaskId) {
      const activeTaskElement = document.getElementById(`task-${activeTaskId}`);
      if (activeTaskElement) {
        activeTaskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeTaskId]);

  return (
    <div
      ref={(node) => {
        drop(node);
      }}
      className={`${color} p-4 rounded-lg ${isOver ? 'bg-gray-100' : ''}`}
    >
      <h3 className="font-semibold mb-2">{displayName}</h3>
      <div className="max-h-[500px] overflow-y-auto">
        {sortedTasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            moveTask={moveTask}
            onTaskAction={onTaskAction}
            id={`task-${task.id}`}
          />
        ))}
      </div>
    </div>
  );
};

function BoardSkeleton() {
  const columns = ['Pending', 'Active', 'Completed'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column} className="rounded-lg bg-gray-100 p-4">
            <Skeleton className="mb-3 h-5 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg border bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="mb-2 h-2 w-full" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BoardContent: React.FC<BoardProps> = ({ tasks, loadTasks, isLoading = false }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { activeTaskId, handleTaskStatusChange } = useTimeTracking();
  const visibleActiveTaskId = activeTaskId ?? tasks.find((task) => task.my_is_tracking)?.id ?? null;

  const moveTask = (taskId: number, newStatus: string) => {
    const task = tasks.find((task) => task.id === taskId);

    if (!task || getBoardGroup(task.state) === getBoardGroup(newStatus)) {
      return;
    }

    setLoading(true);
    axios.patch(`/data/tasks/${taskId}/status`, { state: newStatus })
      .then(async () => {
        await handleTaskStatusChange(taskId, newStatus);
        await loadTasks();
      })
      .catch(() => {
        setError('Failed to update task status');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleTaskAction = async () => {
    await loadTasks();
  };

  const isRecentlyCompleted = (task: Task) => {
    if (!task.completed_at) {
      return false;
    }

    const completedAt = parseISO(task.completed_at);
    return isAfter(completedAt, subDays(new Date(), 3));
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.state === status);
  };

  const getRecentlyCompletedTasks = (statuses: string[]) => {
    return tasks
      .filter((task) => statuses.includes(task.state) && isRecentlyCompleted(task))
      .sort((a, b) => {
        const aDate = a.completed_at ? parseISO(a.completed_at).getTime() : 0;
        const bDate = b.completed_at ? parseISO(b.completed_at).getTime() : 0;
        return bDate - aDate;
      });
  };

  const handleCreateSuccess = () => {
    void loadTasks();
  };

  if (loading || isLoading) {
    return <BoardSkeleton />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Task Board</h2>
        <TaskCreateDrawer onSuccess={handleCreateSuccess} />
      </div>
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskColumn
            key="Pending"
            status="Draft"
            tasks={getTasksByStatus('Draft').concat(getTasksByStatus('Assigned'))}
            moveTask={moveTask}
            onTaskAction={handleTaskAction}
            activeTaskId={visibleActiveTaskId}
          />
          <TaskColumn
            key="Active"
            status="InProgress"
            tasks={getTasksByStatus('InProgress').concat(getTasksByStatus('Blocked'), getTasksByStatus('InReview'))}
            moveTask={moveTask}
            onTaskAction={handleTaskAction}
            activeTaskId={visibleActiveTaskId}
          />
          <TaskColumn
            key="Completed"
            status="Done"
            tasks={getRecentlyCompletedTasks(['Done', 'Cancelled', 'Rejected'])}
            moveTask={moveTask}
            onTaskAction={handleTaskAction}
            activeTaskId={visibleActiveTaskId}
          />
        </div>
      </DndProvider>
    </div>
  );
};

const Board: React.FC<BoardProps> = (props) => {
  return <BoardContent {...props} />
};

export default Board;
