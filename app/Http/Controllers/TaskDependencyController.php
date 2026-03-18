<?php

namespace App\Http\Controllers;

use App\Models\TaskDependency;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskDependencyController extends Controller
{
    /**
     * Display a listing of the task dependencies.
     */
    public function index(Request $request)
    {
        $query = TaskDependency::query();

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('depends_on_task_id')) {
            $query->where('depends_on_task_id', $request->depends_on_task_id);
        }

        if ($request->has('dependency_type')) {
            $query->where('dependency_type', $request->dependency_type);
        }

        $dependencies = $query->with(['task', 'dependsOnTask'])->get();

        return response()->json($dependencies);
    }

    /**
     * Store a newly created task dependency.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'depends_on_task_id' => 'required|exists:tasks,id',
            'dependency_type' => 'required|string',
            'description' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $dependency = TaskDependency::create($validated);

        return response()->json($dependency, 201);
    }

    /**
     * Display the specified task dependency.
     */
    public function show(TaskDependency $taskDependency)
    {
        return response()->json($taskDependency);
    }

    /**
     * Update the specified task dependency.
     */
    public function update(Request $request, TaskDependency $taskDependency)
    {
        $validated = $request->validate([
            'dependency_type' => 'string',
            'description' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $taskDependency->update($validated);

        return response()->json($taskDependency);
    }

    /**
     * Remove the specified task dependency.
     */
    public function destroy(TaskDependency $taskDependency)
    {
        $taskDependency->delete();

        return response()->json(null, 204);
    }
}