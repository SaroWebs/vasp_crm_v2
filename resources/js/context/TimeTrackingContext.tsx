import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Task, TimeEntry } from '@/types';

export interface OverdueWarning {
  taskId: number;
  currentDueDate: string;
  overdueDays: number;
  message: string;
}

interface TimeTrackingContextType {
  activeTaskId: number | null;
  tasks: Map<number, Task>;
  timeEntries: Map<number, TimeEntry[]>;
  isLoading: boolean;
  error: string | null;
  overdueWarning: OverdueWarning | null;
  startTask: (taskId: number, skipOverdueWarning?: boolean) => Promise<void>;
  extendDueDateAndStart: (taskId: number, newDueDate: string) => Promise<void>;
  clearOverdueWarning: () => void;
  pauseTask: (taskId: number) => Promise<void>;
  resumeTask: (taskId: number) => Promise<void>;
  endTask: (taskId: number) => Promise<void>;
  refreshTaskData: (taskId: number) => Promise<void>;
  getWorkingTimeSpent: (taskId: number) => Promise<any>;
  clearActiveTask: () => void;
  handleTaskStatusChange: (taskId: number, newStatus: string) => Promise<void>;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const TimeTrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Map<number, Task>>(new Map());
  const [timeEntries, setTimeEntries] = useState<Map<number, TimeEntry[]>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [overdueWarning, setOverdueWarning] = useState<OverdueWarning | null>(null);

  const refreshTaskData = async (taskId: number) => {
    try {
      const response = await axios.get(`/data/tasks/${taskId}`);
      const taskData = response.data.data;
      
      setTasks(prev => new Map(prev.set(taskId, taskData)));
      setTimeEntries(prev => new Map(prev.set(taskId, taskData.time_entries || [])));

      const hasActiveEntry = taskData.time_entries?.some((entry: TimeEntry) => entry?.is_active) ?? false;
      if (hasActiveEntry) {
        setActiveTaskId(taskId);
      } else if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
    } catch (err) {
      console.error('Failed to refresh task data:', err);
      setError('Failed to refresh task data');
    }
  };

  const getWorkingTimeSpent = async (taskId: number) => {
    try {
      const response = await axios.get(`/my/tasks/${taskId}/working-time-spent`);
      return response.data.data;
    } catch (err) {
      console.error('Failed to get working time spent:', err);
      throw err;
    }
  };

  const startTask = async (taskId: number, skipOverdueWarning: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTaskId && activeTaskId !== taskId) {
        await axios.post(`/my/tasks/${activeTaskId}/pause`);
        await refreshTaskData(activeTaskId);
      }

      const response = await axios.post(`/my/tasks/${taskId}/start`, {}, {
        params: { skip_overdue_warning: skipOverdueWarning }
      });
      
      // Clear overdue warning if task started successfully
      setOverdueWarning(null);
      
      await refreshTaskData(taskId);
      setActiveTaskId(taskId);
    } catch (err: any) {
      console.error('Failed to start task:', err);
      
      // Check if this is an overdue warning
      if (err.response?.data?.overdue_warning) {
        setOverdueWarning({
          taskId: taskId,
          currentDueDate: err.response.data.current_due_date,
          overdueDays: err.response.data.overdue_days,
          message: err.response.data.message
        });
        // Don't set error for overdue warning - we want to show the popup instead
        return;
      }
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to start task');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const extendDueDateAndStart = async (taskId: number, newDueDate: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTaskId && activeTaskId !== taskId) {
        await axios.post(`/my/tasks/${activeTaskId}/pause`);
        await refreshTaskData(activeTaskId);
      }

      await axios.post(`/my/tasks/${taskId}/extend-and-start`, {
        due_at: newDueDate
      });
      
      // Clear overdue warning after extending and starting
      setOverdueWarning(null);
      
      await refreshTaskData(taskId);
      setActiveTaskId(taskId);
    } catch (err: any) {
      console.error('Failed to extend due date and start task:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to extend due date and start task');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearOverdueWarning = () => {
    setOverdueWarning(null);
  };

  const pauseTask = async (taskId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`/my/tasks/${taskId}/pause`);
      await refreshTaskData(taskId);
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
    } catch (err) {
      console.error('Failed to pause task:', err);
      setError('Failed to pause task');
    } finally {
      setIsLoading(false);
    }
  };

  const resumeTask = async (taskId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTaskId && activeTaskId !== taskId) {
        await axios.post(`/my/tasks/${activeTaskId}/pause`);
        await refreshTaskData(activeTaskId);
      }

      await axios.post(`/my/tasks/${taskId}/resume`);
      await refreshTaskData(taskId);
      setActiveTaskId(taskId);
    } catch (err: any) {
      console.error('Failed to resume task:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to resume task');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const endTask = async (taskId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`/my/tasks/${taskId}/end`);
      await refreshTaskData(taskId);
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
    } catch (err) {
      console.error('Failed to end task:', err);
      setError('Failed to end task');
    } finally {
      setIsLoading(false);
    }
  };

  const clearActiveTask = () => {
    setActiveTaskId(null);
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    const activeStates = ['InProgress', 'Blocked', 'InReview'];
    
    if (activeTaskId === taskId && !activeStates.includes(newStatus)) {
      setActiveTaskId(null);
      await refreshTaskData(taskId);
    }
  };

  return (
    <TimeTrackingContext.Provider
      value={{
        activeTaskId,
        tasks,
        timeEntries,
        isLoading,
        error,
        overdueWarning,
        startTask,
        extendDueDateAndStart,
        clearOverdueWarning,
        pauseTask,
        resumeTask,
        endTask,
        refreshTaskData,
        getWorkingTimeSpent,
        clearActiveTask,
        handleTaskStatusChange,
      }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
};

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
};
