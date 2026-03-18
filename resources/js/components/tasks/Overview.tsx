import React, { useEffect, useState } from 'react';
import { Task } from '@/types';

interface TaskSummary {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  overdueTasks: number;
  tasksDueToday: number;
  tasksDueThisWeek: number;
  totalTimeSpent: number;
  totalEstimatedHours: number;
  averageCompletionPercentage: number;
  highPriorityTasks: number;
}

export interface OverviewProps {
  tasks: Task[];
  loadTasks: () => void;
}

const Overview: React.FC<OverviewProps> = ({ tasks, loadTasks }) => {
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTimeDifference = (startTime: string, endTime: string | null): number => {
    if (!endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMs = end.getTime() - start.getTime();
    return diffInMs / (1000 * 60 * 60);
  };

  const calculateTotalTimeSpent = (tasks: Task[]): number => {
    return tasks.reduce((total, task) => {
      const taskTime = task.time_entries?.reduce((sum, entry) => {
        return sum + calculateTimeDifference(entry.start_time, entry.end_time);
      }, 0) || 0;
      return total + taskTime;
    }, 0);
  };

  const terminalStates = ['Done', 'Cancelled', 'Rejected'];

  const isTaskOverdue = (task: Task): boolean => {
    if (typeof task.is_overdue === 'boolean') return task.is_overdue;
    if (!task.due_at || terminalStates.includes(task.state)) return false;
    const dueDate = new Date(task.due_at);
    const now = new Date();
    return dueDate < now;
  };

  const isTaskDueToday = (task: Task): boolean => {
    if (!task.due_at || terminalStates.includes(task.state)) return false;
    const dueDate = new Date(task.due_at);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  const isTaskDueThisWeek = (task: Task): boolean => {
    if (!task.due_at || terminalStates.includes(task.state)) return false;
    const dueDate = new Date(task.due_at);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate > today && dueDate <= weekFromNow;
  };

  const fetchTaskSummary = () => {
    const totalTasks = tasks.length;
    const tasksByStatus: Record<string, number> = {};
    
    tasks.forEach((task: Task) => {
      tasksByStatus[task.state] = (tasksByStatus[task.state] || 0) + 1;
    });

    const overdueTasks = tasks.filter(isTaskOverdue).length;
    const tasksDueToday = tasks.filter(isTaskDueToday).length;
    const tasksDueThisWeek = tasks.filter(isTaskDueThisWeek).length;
    const totalTimeSpent = calculateTotalTimeSpent(tasks);
    const totalEstimatedHours = tasks.reduce((sum: number, task: Task) => sum + (Number(task.estimate_hours) ?? 0), 0);

    const totalCompletionPercentage = tasks.reduce((sum: number, task: Task) => {
      if (task.estimate_hours && task.estimate_hours > 0) {
        const taskTime = task.time_entries?.reduce((entrySum, entry) => {
          return entrySum + calculateTimeDifference(entry.start_time, entry.end_time);
        }, 0) || 0;
        const completion = Math.min((taskTime / task.estimate_hours) * 100, 100);
        return sum + completion;
      }
      return sum;
    }, 0);
    
    const tasksWithEstimates = tasks.filter(task => task.estimate_hours && task.estimate_hours > 0).length;
    const averageCompletionPercentage = tasksWithEstimates > 0 ? totalCompletionPercentage / tasksWithEstimates : 0;

    const highPriorityTasks = tasks.filter((task: Task) => 
      task.sla_policy?.priority === 'P1' || task.sla_policy?.priority === 'P2'
    ).length;

    setSummary({
      totalTasks,
      tasksByStatus,
      overdueTasks,
      tasksDueToday,
      tasksDueThisWeek,
      totalTimeSpent,
      totalEstimatedHours,
      averageCompletionPercentage,
      highPriorityTasks,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchTaskSummary();
  }, [tasks]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }


  return (
    <div className="grid grid-cols-3 gap-4">
      
      {/* Status & Priority Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-xl font-bold text-gray-900 tabular-nums">{summary?.totalTasks || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Done</div>
            <div className="text-xl font-bold text-green-600 tabular-nums">{summary?.tasksByStatus['Done'] || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Active</div>
            <div className="text-base font-semibold text-amber-600 tabular-nums">{summary?.tasksByStatus['InProgress'] || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Priority</div>
            <div className="text-base font-semibold text-orange-600 tabular-nums">{summary?.highPriorityTasks || 0}</div>
          </div>
        </div>
      </div>

      {/* Deadlines Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Deadlines</h3>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">Overdue</span>
            <span className="text-2xl font-bold text-red-600 tabular-nums">{summary?.overdueTasks || 0}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">Today</span>
            <span className="text-lg font-semibold text-purple-600 tabular-nums">{summary?.tasksDueToday || 0}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">This Week</span>
            <span className="text-base font-semibold text-indigo-600 tabular-nums">{summary?.tasksDueThisWeek || 0}</span>
          </div>
        </div>
      </div>

      {/* Time & Progress Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Time</h3>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">Spent</span>
            <span className="text-lg font-semibold text-teal-600 tabular-nums">{Number(summary?.totalTimeSpent || 0).toFixed(1)}h</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">Estimated</span>
            <span className="text-base font-medium text-gray-600 tabular-nums">{Number(summary?.totalEstimatedHours || 0).toFixed(1)}h</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xl font-bold text-blue-600 tabular-nums">{Math.round(summary?.averageCompletionPercentage || 0)}%</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Overview;
