import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, List, KanbanSquare } from 'lucide-react';
import TaskTimeTracker from './TaskTimeTracker';
import TaskTimeline from './Timeline';
import Board from './Board';
import Overview from './Overview';
import { Task as TaskType } from '@/types';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Create a context for task state management
interface TaskContextType {
  tasks: TaskType[];
  loadTasks: () => void;
  handleTimeUpdate: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};


interface PaginatedTasks {
  data: TaskType[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const TaskDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<PaginatedTasks | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadTasks = (page = 1) => {
    setLoading(true);
    axios.get(`/data/my/tasks?page=${page}`)
      .then(res => {
        setTasks(res.data);
        setCurrentPage(page);
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleTimeUpdate = () => {
    loadTasks(currentPage);
  };

  // Provide task context to child components
  const taskContextValue: TaskContextType = {
    tasks: (tasks?.data || []) as TaskType[],
    loadTasks: () => loadTasks(currentPage),
    handleTimeUpdate,
  };

  return (
    <TaskContext.Provider value={taskContextValue}>
      <DndProvider backend={HTML5Backend}>
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Task Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your tasks with calendar, board, and timeline views
              </p>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <KanbanSquare className="mr-2 h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="board">
                <KanbanSquare className="mr-2 h-4 w-4" /> Board
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="mr-2 h-4 w-4" /> Calendar
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <List className="mr-2 h-4 w-4" /> Timeline
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Task Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Overview tasks={tasks?.data || []} loadTasks={loadTasks} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Board Tab */}
            <TabsContent value="board">
              <Card>
                <CardHeader>
                  <CardTitle>Task Board</CardTitle>
                </CardHeader>
                <CardContent>
                  <Board tasks={tasks?.data || []} loadTasks={loadTasks} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Task Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {tasks?.data?.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <h3 className="font-medium">{task.title || `Task #${task.id}`}</h3>
                            <p className="text-sm text-muted-foreground">
                              Due: {task.due_at ? format(new Date(task.due_at), 'MMM dd, yyyy') : 'No due date'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TaskTimeTracker taskId={task.id} onTimeUpdate={handleTimeUpdate} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Task Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskTimeline loadTasks={loadTasks} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {tasks && tasks.last_page > 1 && (
            <div className="flex justify-center mt-4">
              <nav className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTasks(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {tasks.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTasks(currentPage + 1)}
                  disabled={currentPage === tasks.last_page || loading}
                >
                  Next
                </Button>
              </nav>
            </div>
          )}
        </div>
      </DndProvider>
    </TaskContext.Provider>
  );
};

export default TaskDashboard;