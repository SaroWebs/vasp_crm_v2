<?php

namespace App\Models;

use App\Enums\Status;
use Illuminate\Database\Eloquent\Model;

class EmployeeCategory extends Model
{
    protected function casts(): array
    {
        return [
            'status' => Status::class,
        ];
    }
}
