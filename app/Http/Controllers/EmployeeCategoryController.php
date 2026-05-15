<?php

namespace App\Http\Controllers;

use App\Http\Requests\GetEmployeesRequest;
use App\Http\Resources\EmployeeCategoryResource;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Models\EmployeeCategory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class EmployeeCategoryController extends Controller
{
    public function getData(): AnonymousResourceCollection
    {
        $categories = EmployeeCategory::query()->get();

        return EmployeeCategoryResource::collection($categories);
    }

    public function getEmployees(GetEmployeesRequest $request): AnonymousResourceCollection|Response
    {
        $categoryName = $request->input('CategoryName');

        $category = EmployeeCategory::where('name', $categoryName)->first();
        if (! $category) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        $employees = Employee::where('category_id', $category->id)->get();

        return EmployeeResource::collection($employees);
    }
}
