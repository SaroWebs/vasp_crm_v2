<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeCategoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'CategoryId' => $this->id,
            'CategoryName' => $this->name,
            'ApplicableTo' => $this->applicable_to ?? 'staff',
            'DisplayNo' => $this->display_no ?? 1,
            'Status' => $this->status?->toInt() ?? 0,
        ];
    }
}
