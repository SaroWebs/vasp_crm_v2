import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, X, Edit, Trash2, Flag, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Task } from '@/types';

interface TimelineEvent {
  id: number;
  task_id: number;
  event_type: string;
  event_name: string;
  event_description?: string;
  event_date: string;
  is_milestone: boolean;
  metadata?: Record<string, unknown>;
  task?: Task;
}

interface TimelineProps {
  loadTasks?: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ loadTasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    task_id: '',
    event_type: 'milestone',
    event_name: '',
    event_description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    is_milestone: false,
  });

  // Fetch timeline events
  const fetchTimelineEvents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      
      if (filterStartDate && filterEndDate) {
        params.start_date = filterStartDate;
        params.end_date = filterEndDate;
      } else {
        // Default to current month
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        params.start_date = format(monthStart, 'yyyy-MM-dd');
        params.end_date = format(monthEnd, 'yyyy-MM-dd');
      }

      if (eventTypeFilter !== 'all') {
        params.event_type = eventTypeFilter;
      }

      if (milestoneFilter !== 'all') {
        params.is_milestone = milestoneFilter === 'milestone' ? '1' : '0';
      }

      const response = await axios.get('/timeline-events', { params });
      setTimelineEvents(response.data);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const response = await axios.get('/data/my/tasks');
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTimelineEvents();
    fetchTasks();
  }, [currentDate, filterStartDate, filterEndDate, eventTypeFilter, milestoneFilter]);

  // Calendar navigation
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return timelineEvents.filter(event => {
      const eventDate = parseISO(event.event_date);
      return isSameDay(eventDate, date);
    });
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (task.due_at) {
        const dueDate = parseISO(task.due_at);
        return isSameDay(dueDate, date);
      }
      return false;
    });
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventForm(prev => ({
      ...prev,
      event_date: format(date, 'yyyy-MM-dd'),
    }));
  };

  // Handle create/edit event
  const handleSaveEvent = async () => {
    try {
      if (editingEvent) {
        await axios.patch(`/timeline-events/${editingEvent.id}`, eventForm);
      } else {
        await axios.post('/timeline-events', eventForm);
      }
      setIsEventDialogOpen(false);
      setEditingEvent(null);
      setEventForm({
        task_id: '',
        event_type: 'milestone',
        event_name: '',
        event_description: '',
        event_date: format(new Date(), 'yyyy-MM-dd'),
        is_milestone: false,
      });
      fetchTimelineEvents();
      if (loadTasks) loadTasks();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await axios.delete(`/timeline-events/${eventId}`);
      fetchTimelineEvents();
      if (loadTasks) loadTasks();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Handle edit event
  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    setEventForm({
      task_id: event.task_id.toString(),
      event_type: event.event_type,
      event_name: event.event_name,
      event_description: event.event_description || '',
      event_date: format(parseISO(event.event_date), 'yyyy-MM-dd'),
      is_milestone: event.is_milestone,
    });
    setIsEventDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    setEditingEvent(null);
    setEventForm({
      task_id: '',
      event_type: 'milestone',
      event_name: '',
      event_description: '',
      event_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      is_milestone: false,
    });
    setIsEventDialogOpen(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setEventTypeFilter('all');
    setMilestoneFilter('all');
  };

  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      milestone: 'bg-blue-100 text-blue-700 border-blue-300',
      deadline: 'bg-red-100 text-red-700 border-red-300',
      meeting: 'bg-purple-100 text-purple-700 border-purple-300',
      note: 'bg-gray-100 text-gray-700 border-gray-300',
      status_change: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return colors[eventType] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Get task status color
  const getTaskStatusColor = (state: string) => {
    const colors: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-700',
      Assigned: 'bg-blue-100 text-blue-700',
      InProgress: 'bg-indigo-100 text-indigo-700',
      Blocked: 'bg-red-100 text-red-700',
      InReview: 'bg-amber-100 text-amber-700',
      Done: 'bg-emerald-100 text-emerald-700',
      Cancelled: 'bg-slate-100 text-slate-700',
      Rejected: 'bg-rose-100 text-rose-700',
    };
    return colors[state] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
                <SelectTrigger id="milestone">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="milestone">Milestones Only</SelectItem>
                  <SelectItem value="non-milestone">Non-Milestones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Timeline Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? 'Edit Timeline Event' : 'Create Timeline Event'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-task">Task</Label>
                      <Select
                        value={eventForm.task_id}
                        onValueChange={(value) => setEventForm(prev => ({ ...prev, task_id: value }))}
                      >
                        <SelectTrigger id="event-task">
                          <SelectValue placeholder="Select a task" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              {task.title || `Task #${task.id}`} ({task.task_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-type-form">Event Type</Label>
                      <Select
                        value={eventForm.event_type}
                        onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}
                      >
                        <SelectTrigger id="event-type-form">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="status_change">Status Change</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-name">Event Name</Label>
                      <Input
                        id="event-name"
                        value={eventForm.event_name}
                        onChange={(e) => setEventForm(prev => ({ ...prev, event_name: e.target.value }))}
                        placeholder="Enter event name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-description">Description</Label>
                      <Textarea
                        id="event-description"
                        value={eventForm.event_description}
                        onChange={(e) => setEventForm(prev => ({ ...prev, event_description: e.target.value }))}
                        placeholder="Enter event description"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-date-form">Event Date</Label>
                      <Input
                        id="event-date-form"
                        type="date"
                        value={eventForm.event_date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is-milestone"
                        checked={eventForm.is_milestone}
                        onChange={(e) => setEventForm(prev => ({ ...prev, is_milestone: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="is-milestone" className="cursor-pointer">
                        Mark as milestone
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEvent}>
                      {editingEvent ? 'Update' : 'Create'} Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading timeline events...</div>
            </div>
          ) : (
            <>
              {/* Calendar Header */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, dayIdx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const dayEvents = getEventsForDate(day);
                  const dayTasks = getTasksForDate(day);

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleDateClick(day)}
                      className={`
                        min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${isSelected ? 'bg-primary/10 border-primary' : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <div className={`
                        text-sm font-medium mb-1
                        ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                        ${isToday ? 'text-primary font-bold' : ''}
                      `}>
                        {format(day, 'd')}
                      </div>
                      
                      {/* Events */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs px-1.5 py-0.5 rounded border ${getEventTypeColor(event.event_type)}`}
                            title={event.event_name}
                          >
                            <div className="flex items-center gap-1 truncate">
                              {event.is_milestone && <Flag className="h-3 w-3" />}
                              <span className="truncate">{event.event_name}</span>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1.5">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Tasks */}
                      <div className="space-y-1 mt-1">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs px-1.5 py-0.5 rounded ${getTaskStatusColor(task.state)}`}
                            title={task.title || `Task #${task.id}`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">{task.title || `Task #${task.id}`}</span>
                            </div>
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1.5">
                            +{dayTasks.length - 2} more tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Events for selected date */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Timeline Events ({getEventsForDate(selectedDate).length})
                </h3>
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events on this date</p>
                ) : (
                  <div className="space-y-2">
                    {getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border ${getEventTypeColor(event.event_type)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {event.is_milestone && <Flag className="h-4 w-4" />}
                              <h4 className="font-semibold">{event.event_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {event.event_type}
                              </Badge>
                            </div>
                            {event.event_description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {event.event_description}
                              </p>
                            )}
                            {event.task && (
                              <p className="text-xs text-muted-foreground">
                                Task: {event.task.title || `Task #${event.task.id}`} ({event.task.task_code})
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(event.event_date), 'h:mm a')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks for selected date */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Tasks Due ({getTasksForDate(selectedDate).length})
                </h3>
                {getTasksForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks due on this date</p>
                ) : (
                  <div className="space-y-2">
                    {getTasksForDate(selectedDate).map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">
                                {task.title || `Task #${task.id}`}
                              </h4>
                              <Badge className={getTaskStatusColor(task.state)}>
                                {task.state}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Code: {task.task_code}</span>
                              {task.estimate_hours && (
                                <span>Est: {task.estimate_hours}h</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Timeline;
