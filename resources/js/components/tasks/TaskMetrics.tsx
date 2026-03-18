import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Clock3, Target } from 'lucide-react';
import { useTimeTracking } from '@/context/TimeTrackingContext';
import { useEffect, useState } from 'react';
import { Loader, Progress } from '@mantine/core';
import { TimeEntry } from '@/types';

interface TaskMetricsProps {
  taskId: number;
}

export const TaskMetrics: React.FC<TaskMetricsProps> = ({ taskId }) => {
  const {
    tasks,
    timeEntries,
    refreshTaskData,
    getWorkingTimeSpent
  } = useTimeTracking();

  const [timeData, setTimeData] = useState({
    timeSpent: 0,
    totalTimeSpent: 0,
    remainingTime: 0,
    isActive: false
  });

  const [workingTimeData, setWorkingTimeData] = useState<any>(null);
  const [localSecondsElapsed, setLocalSecondsElapsed] = useState(0);

  const task = tasks.get(taskId);
  const taskTimeEntries = timeEntries.get(taskId) || [];

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

  // Sync with backend every minute
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

  if (!task) {
    return <div><Loader size="sm" /> Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4 text-muted-foreground" />
          Metrics & Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated Hours</span>
            </div>
            <div className="text-sm font-medium">
              {task.estimate_hours ? (
                `${task.estimate_hours}h`
              ) : (
                <span className="text-muted-foreground">
                  Not set
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <span>Time Spent</span>
            </div>
            <div className="text-sm font-medium">
              {formatTime(getTotalTimeSpent())}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Progress</span>
              </div>
              <span className="font-medium">
                {Math.round(calculateProgress())}%
              </span>
            </div>
            <Progress
              value={calculateProgress()}
              radius="xs" size="sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
