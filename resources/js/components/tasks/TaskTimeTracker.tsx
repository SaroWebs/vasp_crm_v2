import React, { useState, useEffect, useCallback } from 'react';
import { Text, Paper, Loader, Progress, Tooltip, ActionIcon } from '@mantine/core';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { TimeEntry } from '@/types';
import { useTimeTracking } from '@/context/TimeTrackingContext';
import { OverdueWarningDialog } from './OverdueWarningDialog';
import axios from 'axios';
import { HolidaysConfig, WorkingHoursConfig, isWithinWorkingHours } from '@/utils/workingHours';

interface TaskTimeTrackerProps {
  taskId: number;
  taskState?: string;
  onTimeUpdate: () => void;
  onTaskAction?: (action: 'start' | 'resume' | 'pause' | 'end', taskId: number) => void;
}

const TaskTimeTracker: React.FC<TaskTimeTrackerProps> = ({ taskId, taskState, onTimeUpdate, onTaskAction }) => {
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
  
  const [showOverdueDialog, setShowOverdueDialog] = useState(false);
  
  const [timeData, setTimeData] = useState({
    timeSpent: 0,
    totalTimeSpent: 0,
    remainingTime: 0,
    isActive: false
  });

  const [workingTimeData, setWorkingTimeData] = useState<any>(null);
  const [localSecondsElapsed, setLocalSecondsElapsed] = useState(0);
  const [workingHoursConfig, setWorkingHoursConfig] = useState<WorkingHoursConfig | null>(null);
  const [holidaysConfig, setHolidaysConfig] = useState<HolidaysConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Watch for overdue warning and show dialog
  useEffect(() => {
    if (overdueWarning && overdueWarning.taskId === taskId) {
      setShowOverdueDialog(true);
    } else {
      setShowOverdueDialog(false);
    }
  }, [overdueWarning, taskId]);

  const task = tasks.get(taskId);
  const taskTimeEntries = timeEntries.get(taskId) || [];

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

  const pauseTaskAndRefresh = useCallback(async () => {
    await pauseTask(taskId);
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

  // Initialize with working time from task data
  useEffect(() => {
    if (!task) {
      refreshTaskData(taskId);
    } else {
      if (task.total_working_time_spent) {
        setWorkingTimeData({
          total_working_time_spent: task.total_working_time_spent_seconds,
          total_working_time_spent_hours: task.total_working_time_spent
        });
      }

      const hasActiveEntry = taskTimeEntries.some((entry: TimeEntry) => entry?.is_active);
      setTimeData(prev => ({ ...prev, isActive: !!hasActiveEntry }));
    }
  }, [task, taskTimeEntries, taskId, refreshTaskData]);

  // Sync isActive state with activeTaskId from context
  // This ensures the timer stops when the task is no longer active in the context
  // (e.g., when dragged to a different column)
  useEffect(() => {
    if (activeTaskId === null) {
      // No task is active, so this task is not active
      setTimeData(prev => ({ ...prev, isActive: false }));
    } else if (activeTaskId === taskId) {
      // This task is the active task - check if there's an active time entry
      const hasActiveEntry = taskTimeEntries.some((entry: TimeEntry) => entry?.is_active);
      setTimeData(prev => ({ ...prev, isActive: !!hasActiveEntry }));
    } else {
      // Another task is active, so this task is not active
      setTimeData(prev => ({ ...prev, isActive: false }));
    }
  }, [activeTaskId, taskId, taskTimeEntries]);

  // Local timer counting each second
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timeData.isActive) {
      interval = setInterval(() => {
        setLocalSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setLocalSecondsElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeData.isActive]);

  // Auto-pause when the running entry leaves working hours
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timeData.isActive && configLoaded && workingHoursConfig) {
      const checkWorkingHours = async () => {
        if (!isWithinWorkingHours(new Date(), workingHoursConfig, holidaysConfig)) {
          try {
            await pauseTaskAndRefresh();
          } catch (err) {
            console.error('Failed to auto-pause task outside working hours:', err);
          }
        }
      };

      void checkWorkingHours();
      interval = setInterval(() => {
        void checkWorkingHours();
      }, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeData.isActive, configLoaded, workingHoursConfig, holidaysConfig, pauseTaskAndRefresh]);

  // Sync with backend every 5 minutes
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timeData.isActive) {
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
  }, [timeData.isActive, taskId, getWorkingTimeSpent, refreshTaskData]);

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
    setShowOverdueDialog(false);
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
    setShowOverdueDialog(false);
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
    const backendSeconds = workingTimeData?.total_working_time_spent || 0;
    return backendSeconds + localSecondsElapsed;
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

  // Check if start/resume actions should be disabled
  const shouldDisableStartResume = !isWorkingTime();

  return (
    <Paper shadow="xs" p="sm" radius="md" className="mt-4">
      <div className="w-full flex gap-2">
        {/* Progress Bar Section */}
        <div className='flex-1'>
          <Progress
            value={calculateProgress()}
            color={getProgressColor()}
            radius="xs" size="sm"
            animated={timeData.isActive}
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

            {!timeData.isActive ? (
              <>
                {taskTimeEntries.length === 0 ? (
                  <Tooltip label={shouldDisableStartResume ? "Task actions are not available outside working hours" : "Start tracking time"}>
                    <ActionIcon
                      size="lg"
                      onClick={(e) => handleStart(e)}
                      disabled={isLoading || shouldDisableStartResume}
                      color={shouldDisableStartResume ? "gray" : "green"}
                      variant="filled"
                    >
                      <Play size={18} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip label={shouldDisableStartResume ? "Task actions are not available outside working hours" : "Resume tracking time"}>
                    <ActionIcon
                      size="lg"
                      onClick={(e) => handleResume(e)}
                      disabled={isLoading || shouldDisableStartResume}
                      color={shouldDisableStartResume ? "gray" : "blue"}
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
            setShowOverdueDialog(false);
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
