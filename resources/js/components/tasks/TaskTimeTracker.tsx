import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Text, Paper, Loader, Progress, Tooltip, ActionIcon } from '@mantine/core';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { useTimeTracking } from '@/context/TimeTrackingContext';
import { OverdueWarningDialog } from './OverdueWarningDialog';
import { Task } from '@/types';

interface TaskTimeTrackerProps {
  taskId: number;
  taskState?: string;
  initialTask?: Task;
  onTimeUpdate: () => void;
  onTaskAction?: (action: 'start' | 'resume' | 'pause' | 'end', taskId: number) => void;
}

interface WorkingTimeData {
  total_working_time_spent?: number;
  total_working_time_spent_hours?: number | string;
}

const TaskTimeTracker: React.FC<TaskTimeTrackerProps> = ({ taskId, taskState, initialTask, onTimeUpdate, onTaskAction }) => {
  const isCompleted = taskState === 'Done' || taskState === 'Cancelled' || taskState === 'Rejected';
  const { 
    tasks, 
    timeEntries, 
    activeTaskId, 
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
    getWorkingTimeSpent
  } = useTimeTracking();
  
  const [workingTimeData, setWorkingTimeData] = useState<WorkingTimeData | null>(null);
  const [localSecondsElapsed, setLocalSecondsElapsed] = useState(0);

  const task = tasks.get(taskId) ?? initialTask;
  const taskTimeEntries = useMemo(
    () => timeEntries.get(taskId) || initialTask?.time_entries || [],
    [timeEntries, taskId, initialTask?.time_entries],
  );
  const isMyTracking = Boolean(task?.my_is_tracking);
  const isTaskTimerActive = activeTaskId === taskId && isMyTracking;
  const showOverdueDialog = Boolean(overdueWarning && overdueWarning.taskId === taskId);
  const taskWorkingTimeData: WorkingTimeData | null = task?.total_working_time_spent
    ? {
        total_working_time_spent: task.total_working_time_spent_seconds,
        total_working_time_spent_hours: task.total_working_time_spent
      }
    : null;

  const pauseTaskAndRefresh = useCallback(async () => {
    await pauseTask(taskId);
    setLocalSecondsElapsed(0);
    onTimeUpdate();

    if (onTaskAction) {
      onTaskAction('pause', taskId);
    }

    try {
      const data = await getWorkingTimeSpent(taskId);
      setWorkingTimeData(data);
    } catch (err) {
      console.error('Failed to fetch working time data:', err);
    }
  }, [pauseTask, taskId, onTimeUpdate, onTaskAction, getWorkingTimeSpent]);

  // Initialize task data if the context does not have it yet.
  useEffect(() => {
    if (!task && !initialTask) {
      void refreshTaskData(taskId);
    }
  }, [initialTask, task, taskId, refreshTaskData]);

  // Local timer counting each second
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isTaskTimerActive) {
      interval = setInterval(() => {
        setLocalSecondsElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTaskTimerActive]);

  // Sync with backend every 5 minutes
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isTaskTimerActive) {
      interval = setInterval(async () => {
        try {
          const data = await getWorkingTimeSpent(taskId);
          setWorkingTimeData(data);
          setLocalSecondsElapsed(0);
          await refreshTaskData(taskId);
        } catch (err) {
          console.error('Failed to sync working time data:', err);
        }
      }, 300000); // 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTaskTimerActive, taskId, getWorkingTimeSpent, refreshTaskData]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return '00:00:00';
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await startTask(taskId);
    setLocalSecondsElapsed(0);
    // Only call callbacks if there's no overdue warning
    if (!overdueWarning) {
      onTimeUpdate();
      onTaskAction?.('start', taskId);
      try {
        const data = await getWorkingTimeSpent(taskId);
        setWorkingTimeData(data);
      } catch (err) {
        console.error('Failed to fetch working time data:', err);
      }
    }
  };

  const handleStartAnyway = async () => {
    await startTask(taskId, true); // Skip overdue warning
    clearOverdueWarning();
    setLocalSecondsElapsed(0);
    onTimeUpdate();
    onTaskAction?.('start', taskId);
    try {
      const data = await getWorkingTimeSpent(taskId);
      setWorkingTimeData(data);
    } catch (err) {
      console.error('Failed to fetch working time data:', err);
    }
  };

  const handleExtendAndStart = async (newDueDate: string) => {
    await extendDueDateAndStart(taskId, newDueDate);
    clearOverdueWarning();
    onTimeUpdate();
    onTaskAction?.('start', taskId);
    try {
      const data = await getWorkingTimeSpent(taskId);
      setWorkingTimeData(data);
    } catch (err) {
      console.error('Failed to fetch working time data:', err);
    }
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await pauseTaskAndRefresh();
  };

  const handleResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await resumeTask(taskId);
    setLocalSecondsElapsed(0);
    onTimeUpdate();
    onTaskAction?.('resume', taskId);
    try {
      const data = await getWorkingTimeSpent(taskId);
      setWorkingTimeData(data);
    } catch (err) {
      console.error('Failed to fetch working time data:', err);
    }
  };

  const handleEnd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await endTask(taskId);
    setLocalSecondsElapsed(0);
    onTimeUpdate();
    onTaskAction?.('end', taskId);
    try {
      const data = await getWorkingTimeSpent(taskId);
      setWorkingTimeData(data);
    } catch (err) {
      console.error('Failed to fetch working time data:', err);
    }
  };

  if (!task) {
    return <div><Loader size="sm" /> Loading...</div>;
  }

  const formatTimeFromSeconds = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds === null || seconds === undefined) {
      return '00:00:00';
    }
    return formatTime(seconds);
  };

  // Calculate total time spent (backend + local)
  const getTotalTimeSpent = () => {
    const backendSeconds = workingTimeData?.total_working_time_spent || taskWorkingTimeData?.total_working_time_spent || 0;
    return backendSeconds + (isTaskTimerActive ? localSecondsElapsed : 0);
  };

  const calculateProgress = () => {
    if (!task?.estimate_hours || task.estimate_hours <= 0) return 0;
    
    const totalTimeSpentHours = getTotalTimeSpent() / 3600;
    const progress = (totalTimeSpentHours / task.estimate_hours) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 100) return 'green';
    if (progress >= 75) return 'blue';
    if (progress >= 50) return 'yellow';
    if (progress >= 25) return 'orange';
    return 'red';
  };

  return (
    <Paper shadow="xs" p="sm" radius="md" className="mt-4">
      <div className="w-full flex gap-2">
        {/* Progress Bar Section */}
        <div className='flex-1'>
          <Progress
            value={calculateProgress()}
            color={getProgressColor()}
            radius="xs" size="sm"
            animated={isTaskTimerActive}
          />
          <div className="flex justify-between mt-1">
            <Text size="xs" color="dimmed">
              {formatTime(getTotalTimeSpent())} / {formatTimeFromSeconds((task?.estimate_hours || 0) * 3600)}
            </Text>
            <Text size="xs" color="dimmed">
              {Math.round(calculateProgress())}%
            </Text>
          </div>
        </div>

        {/* Action Buttons - Hidden for completed tasks */}
        {!isCompleted && (
          <div className="flex justify-end space-x-2">
            {error && (
              <Tooltip label={error} color="orange" withArrow>
                <div className="text-orange-500 text-xs">⚠️</div>
              </Tooltip>
            )}

            {!isTaskTimerActive ? (
              <>
                {taskTimeEntries.length === 0 ? (
                  <Tooltip label="Start tracking time">
                    <ActionIcon
                      size="lg"
                      onClick={(e) => handleStart(e)}
                      disabled={isLoading}
                      color="green"
                      variant="filled"
                    >
                      <Play size={18} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip label="Resume tracking time">
                    <ActionIcon
                      size="lg"
                      onClick={(e) => handleResume(e)}
                      disabled={isLoading}
                      color="blue"
                      variant="filled"
                    >
                      <SkipForward size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </>
            ) : (
              <>
                <Tooltip label="Pause tracking">
                  <ActionIcon
                    size="lg"
                    onClick={(e) => handlePause(e)}
                    disabled={isLoading}
                    color="yellow"
                    variant="filled"
                  >
                    <Pause size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="End tracking">
                  <ActionIcon
                    size="lg"
                    onClick={(e) => handleEnd(e)}
                    disabled={isLoading}
                    color="red"
                    variant="filled"
                  >
                    <Square size={18} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Overdue Warning Dialog */}
      {overdueWarning && (
        <OverdueWarningDialog
          isOpen={showOverdueDialog}
          onClose={() => {
            clearOverdueWarning();
          }}
          onStartAnyway={handleStartAnyway}
          onExtendAndStart={handleExtendAndStart}
          overdueDays={overdueWarning.overdueDays}
          currentDueDate={overdueWarning.currentDueDate}
          isLoading={isLoading}
        />
      )}
    </Paper>
  );
};

export default TaskTimeTracker;
