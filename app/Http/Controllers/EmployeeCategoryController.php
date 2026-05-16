<?php

namespace App\Http\Controllers;

use App\Http\Requests\GetEmployeesRequest;
use App\Http\Resources\EmployeeCategoryResource;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Models\EmployeeCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeCategoryController extends Controller
{
    public function getData(Request $request): JsonResponse
    {
        $categories = EmployeeCategory::query()->get();

        return response()->json([
            'result' => EmployeeCategoryResource::collection($categories)->resolve($request),
        ]);
    }

    public function getEmployees(GetEmployeesRequest $request): JsonResponse
    {
        $categoryName = $request->input('Name');

        $category = EmployeeCategory::where('name', $categoryName)->first();
        if (! $category) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        $employees = Employee::query()
            ->where('category_id', $category->id)
            ->get();

        return response()->json([
            'result' => EmployeeResource::collection($employees)->resolve($request),
        ]);
    }
}
