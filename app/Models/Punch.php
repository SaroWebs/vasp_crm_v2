<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Punch extends Model
{
    protected $connection = 'tmp_db';

    protected $table = 'punches';

    public $timestamps = false;

    protected $fillable = [
        'EmployeeId',
        'MachineId',
        'PunchTime',
        'Ip',
        'GroupName',
        'EmployeeName',
        'Islive',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'PunchTime' => 'datetime',
            'Islive' => 'boolean',
        ];
    }
}
