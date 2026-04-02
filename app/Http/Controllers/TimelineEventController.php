<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimelineEvent;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TimelineEventController extends Controller
{
    /**
     * Display a listing of the timeline events.
     */
    public function index(Request $request)
    {
        $query = TimelineEvent::query();

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        if ($request->has('is_milestone')) {
            $query->where('is_milestone', $request->is_milestone);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('event_date', [$request->start_date, $request->end_date]);
        }

        $events = $query->with('task')->get();

        return response()->json($events);
    }

    /**
     * Store a newly created timeline event.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'event_type' => 'required|string',
            'event_name' => 'required|string',
            'event_description' => 'nullable|string',
            'event_date' => 'required|date',
            'is_milestone' => 'nullable|boolean',
            'metadata' => 'nullable|array',
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:5120', 'mimes:jpeg,png,gif,pdf,docx,txt'],
        ]);

        $validated['user_id'] = Auth::id();
        $validated['is_milestone'] = false;

        unset($validated['attachments']);

        $event = TimelineEvent::create($validated);

        // Handle file uploads and create attachment records
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('timeline_attachments', 'public');

                $event->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'metadata' => [
                        'original_name' => $file->getClientOriginalName(),
                        'extension' => $file->getClientOriginalExtension(),
                    ],
                ]);
            }
        }

        return response()->json($event->load('attachments'), 201);
    }

    /**
     * Display the specified timeline event.
     */
    public function show(TimelineEvent $timelineEvent)
    {
        return response()->json($timelineEvent);
    }

    /**
     * Update the specified timeline event.
     */
    public function update(Request $request, TimelineEvent $timelineEvent)
    {
        $validated = $request->validate([
            'event_type' => 'string',
            'event_name' => 'string',
            'event_description' => 'nullable|string',
            'event_date' => 'date',
            'is_milestone' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $timelineEvent->update($validated);

        return response()->json($timelineEvent);
    }

    /**
     * Remove the specified timeline event.
     */
    public function destroy(TimelineEvent $timelineEvent)
    {
        $timelineEvent->delete();

        return response()->json(null, 204);
    }

    public function storeReport(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'event_name' => 'required|string',
            'event_description' => 'nullable|string',
            'event_date' => 'required|date',
            'metadata' => 'nullable|array',
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:5120', 'mimes:jpeg,png,gif,pdf,docx,txt'],
        ]);

        $validated['user_id'] = Auth::id();
        $validated['is_milestone'] = false;
        $validated['event_type'] = 'daily_report';

        unset($validated['attachments']);

        $event = TimelineEvent::create($validated);

        // Handle file uploads and create attachment records
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('timeline_attachments', 'public');

                $event->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'metadata' => [
                        'original_name' => $file->getClientOriginalName(),
                        'extension' => $file->getClientOriginalExtension(),
                    ],
                ]);
            }
        }

        return response()->json($event->load('attachments'), 201);
    }

    /**
     * Store a newly created milestone.
     */
    public function storeMilestone(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'event_name' => 'required|string',
            'event_description' => 'nullable|string',
            'event_date' => 'required|date',
            'milestone_type' => 'required|in:start,checkpoint,completion,deadline',
            'target_date' => 'required|date|after:event_date',
            'progress_percentage' => 'nullable|integer|min:0|max:100',
            'metadata' => 'nullable|array',
        ]);

        // Get the task to validate against its dates
        $task = Task::find($validated['task_id']);

        $eventDate = Carbon::parse($validated['event_date']);
        $targetDate = Carbon::parse($validated['target_date']);

        // Validate event/target are within task date range.
        $rangeError = $this->validateMilestoneRangeAgainstTask($task, $eventDate, $targetDate);
        if ($rangeError) {
            return response()->json([
                'error' => $rangeError,
            ], 422);
        }

        // Validate no timeslot overlap with existing milestones.
        $overlapMilestone = $this->findOverlappingMilestone($task, $eventDate, $targetDate);
        if ($overlapMilestone) {
            $overlapStart = Carbon::parse($overlapMilestone->event_date)->format('M d, Y h:i A');
            $overlapEnd = Carbon::parse($overlapMilestone->target_date)->format('M d, Y h:i A');

            return response()->json([
                'error' => 'Cannot create milestone - timeslot overlaps with "'.
                    $overlapMilestone->event_name.'" ('.$overlapStart.' to '.$overlapEnd.')',
            ], 422);
        }

        $validated['user_id'] = Auth::id();
        $validated['is_milestone'] = true;
        $validated['event_type'] = 'milestone';
        $validated['is_completed'] = false;
        $validated['progress_percentage'] = $validated['progress_percentage'] ?? 0;

        $milestone = TimelineEvent::create($validated);

        return response()->json($milestone->load('task'), 201);
    }

    /**
     * Update a milestone.
     */
    public function updateMilestone(Request $request, TimelineEvent $timelineEvent)
    {
        if (! $timelineEvent->is_milestone) {
            return response()->json(['error' => 'This is not a milestone'], 400);
        }

        $validated = $request->validate([
            'event_name' => 'sometimes|string',
            'event_description' => 'nullable|string',
            'event_date' => 'sometimes|date',
            'milestone_type' => 'sometimes|in:start,checkpoint,completion,deadline',
            'target_date' => 'sometimes|date',
            'progress_percentage' => 'nullable|integer|min:0|max:100',
            'metadata' => 'nullable|array',
        ]);

        $eventDate = isset($validated['event_date'])
            ? Carbon::parse($validated['event_date'])
            : Carbon::parse($timelineEvent->event_date);
        $targetDate = isset($validated['target_date'])
            ? Carbon::parse($validated['target_date'])
            : Carbon::parse($timelineEvent->target_date);

        if (! $targetDate->gt($eventDate)) {
            return response()->json([
                'error' => 'Target date must be after event date',
            ], 422);
        }

        $rangeError = $this->validateMilestoneRangeAgainstTask($timelineEvent->task, $eventDate, $targetDate);
        if ($rangeError) {
            return response()->json([
                'error' => $rangeError,
            ], 422);
        }

        $overlapMilestone = $this->findOverlappingMilestone($timelineEvent->task, $eventDate, $targetDate, $timelineEvent->id);
        if ($overlapMilestone) {
            $overlapStart = Carbon::parse($overlapMilestone->event_date)->format('M d, Y h:i A');
            $overlapEnd = Carbon::parse($overlapMilestone->target_date)->format('M d, Y h:i A');

            return response()->json([
                'error' => 'Cannot update milestone - timeslot overlaps with "'.
                    $overlapMilestone->event_name.'" ('.$overlapStart.' to '.$overlapEnd.')',
            ], 422);
        }

        $timelineEvent->update($validated);

        return response()->json($timelineEvent->fresh()->load('task'));
    }

    /**
     * Mark a milestone as completed.
     */
    public function completeMilestone(Request $request, TimelineEvent $timelineEvent)
    {
        if (! $timelineEvent->is_milestone) {
            return response()->json(['error' => 'This is not a milestone'], 400);
        }

        $validated = $request->validate([
            'progress_percentage' => 'nullable|integer|min:0|max:100',
        ]);

        $timelineEvent->is_completed = true;
        $timelineEvent->completed_at = now();

        if (isset($validated['progress_percentage'])) {
            $timelineEvent->progress_percentage = $validated['progress_percentage'];
        } else {
            $timelineEvent->progress_percentage = 100;
        }

        $timelineEvent->save();

        return response()->json($timelineEvent);
    }

    /**
     * Delete a milestone.
     */
    public function destroyMilestone(TimelineEvent $timelineEvent)
    {
        if (! $timelineEvent->is_milestone) {
            return response()->json(['error' => 'This is not a milestone'], 400);
        }

        $timelineEvent->delete();

        return response()->json([
            'message' => 'Milestone deleted successfully',
        ]);
    }

    /**
     * Get all milestones for a specific task.
     */
    public function getMilestonesForTask(Task $task)
    {
        $milestones = TimelineEvent::query()
            ->milestone()
            ->where('task_id', $task->id)
            ->orderBy('target_date', 'asc')
            ->get();

        return response()->json($milestones);
    }

    /**
     * Get milestone summary for admin dashboard.
     */
    public function getMilestoneSummary(Request $request)
    {
        $query = TimelineEvent::query()->milestone();

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('is_completed')) {
            $query->where('is_completed', $request->is_completed);
        }

        $total = $query->count();
        $completed = (clone $query)->where('is_completed', true)->count();
        $pending = (clone $query)->where('is_completed', false)->count();
        $overdue = (clone $query)
            ->where('is_completed', false)
            ->where('target_date', '<', now())
            ->count();

        return response()->json([
            'total' => $total,
            'completed' => $completed,
            'pending' => $pending,
            'overdue' => $overdue,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
        ]);
    }

    private function validateMilestoneRangeAgainstTask(Task $task, Carbon $eventDate, Carbon $targetDate): ?string
    {
        if ($task->start_at && $eventDate->lt(Carbon::parse($task->start_at))) {
            return 'Event date cannot be before task start date';
        }

        if ($task->due_at && $eventDate->gt(Carbon::parse($task->due_at))) {
            return 'Event date cannot be after task due date';
        }

        if ($task->start_at && $targetDate->lt(Carbon::parse($task->start_at))) {
            return 'Target date cannot be before task start date';
        }

        if ($task->due_at && $targetDate->gt(Carbon::parse($task->due_at))) {
            return 'Target date cannot be after task due date';
        }

        return null;
    }

    private function findOverlappingMilestone(
        Task $task,
        Carbon $eventDate,
        Carbon $targetDate,
        ?int $ignoreMilestoneId = null
    ): ?TimelineEvent {
        $query = $task->timelineEvents()
            ->milestone()
            ->whereNotNull('event_date')
            ->whereNotNull('target_date');

        if ($ignoreMilestoneId) {
            $query->where('id', '!=', $ignoreMilestoneId);
        }

        $existingMilestones = $query->get();

        foreach ($existingMilestones as $existing) {
            $existingStart = Carbon::parse($existing->event_date);
            $existingEnd = Carbon::parse($existing->target_date);

            $isOverlapping = $eventDate->lt($existingEnd) && $targetDate->gt($existingStart);
            if ($isOverlapping) {
                return $existing;
            }
        }

        return null;
    }
}
