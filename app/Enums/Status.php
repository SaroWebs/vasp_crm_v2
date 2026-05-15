<?php

namespace App\Enums;

enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    public function toInt(): int
    {
        return match ($this) {
            self::Active => 1,
            self::Inactive => 0,
        };
    }
}
