<?php

// app/Http/Controllers/HolidayController.php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    // GET /api/holidays?year=2026
    public function index(Request $request)
    {
        $year = $request->integer('year', now()->year);

        $holidays = Holiday::forYear($year)
            ->when($request->type, fn ($q) => $q->ofType($request->type))
            ->orderBy('date')
            ->get();

        return response()->json([
            'year' => $year,
            'holidays' => $holidays,
        ]);
    }

    // POST /api/holidays
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'name' => 'required|string|max:100',
            'type' => 'required|in:national,state,restricted',
        ]);

        return response()->json(Holiday::create($validated), 201);
    }

    // copy-year: no year field needed, just shift the date
    public function copyYear(Request $request)
    {
        $request->validate([
            'from_year' => 'required|integer|min:2000|max:2100',
            'to_year' => 'required|integer|min:2000|max:2100|different:from_year',
        ]);

        $source = Holiday::forYear($request->from_year)->get();

        if ($source->isEmpty()) {
            return response()->json(['message' => 'No holidays found for the source year.'], 404);
        }

        if (Holiday::forYear($request->to_year)->exists()) {
            return response()->json(['message' => "Year {$request->to_year} already has holidays."], 422);
        }

        $newHolidays = $source->map(fn ($h) => [
            'date' => $request->to_year.$h->date->format('-m-d'),
            'name' => $h->name,
            'type' => $h->type,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        Holiday::insert($newHolidays);

        return response()->json([
            'message' => "Copied {$source->count()} holidays to {$request->to_year}.",
            'holidays' => Holiday::forYear($request->to_year)->orderBy('date')->get(),
        ], 201);
    }

    // PUT /api/holidays/d/{holiday}
    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'name' => 'required|string|max:100',
            'type' => 'required|in:national,state,restricted',
        ]);

        $holiday->update($validated);

        return response()->json($holiday);
    }

    // DELETE /api/holidays/d/{holiday}
    public function destroy(Holiday $holiday)
    {
        $holiday->delete();

        return response()->json(['message' => 'Holiday deleted successfully.']);
    }
}
