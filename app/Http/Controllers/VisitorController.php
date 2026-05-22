<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVisitorRequest;
use App\Http\Requests\UpdateVisitorRequest;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VisitorController extends Controller
{
    /**
     * Display a listing of all visitors
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = Visitor::query();

        // Search functionality
        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('card_number', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%');
            });
        }

        // Filter by active status
        if ($request->has('is_active') && in_array($request->is_active, ['true', 'false', '1', '0'])) {
            $isActive = in_array($request->is_active, ['true', '1']);
            $query->where('is_active', $isActive);
        }

        $visitors = $query->orderBy('code')
            ->paginate(15)
            ->withQueryString();

        return response()->json($visitors);
    }

    /**
     * Store a newly created visitor in storage
     */
    public function store(StoreVisitorRequest $request): JsonResponse
    {
        $visitor = Visitor::create($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Visitor created successfully',
            'visitor' => $visitor,
        ], 201);
    }

    /**
     * Display the specified visitor
     */
    public function show(Visitor $visitor): JsonResponse
    {
        $visitor->load('punches');

        return response()->json($visitor);
    }

    /**
     * Update the specified visitor in storage
     */
    public function update(UpdateVisitorRequest $request, Visitor $visitor): JsonResponse
    {
        $visitor->update($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Visitor updated successfully',
            'visitor' => $visitor,
        ]);
    }

    /**
     * Remove the specified visitor from storage
     */
    public function destroy(Visitor $visitor): JsonResponse
    {
        $visitor->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Visitor deleted successfully',
        ]);
    }

    /**
     * Get visitor statistics/punch history
     */
    public function getPunchHistory(Visitor $visitor, Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);

        $punches = $visitor->punches()
            ->orderBy('punch_time', 'desc')
            ->paginate($perPage);

        return response()->json([
            'visitor' => $visitor,
            'punches' => $punches,
        ]);
    }

    /**
     * Bulk delete visitors
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:visitors,id',
        ])['ids'];

        Visitor::whereIn('id', $ids)->delete();

        return response()->json([
            'status' => 'success',
            'message' => count($ids).' visitor(s) deleted successfully',
        ]);
    }

    /**
     * Bulk toggle active status
     */
    public function bulkToggleActive(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:visitors,id',
            'is_active' => 'required|boolean',
        ]);

        Visitor::whereIn('id', $data['ids'])->update(['is_active' => $data['is_active']]);

        return response()->json([
            'status' => 'success',
            'message' => count($data['ids']).' visitor(s) updated successfully',
        ]);
    }
}
