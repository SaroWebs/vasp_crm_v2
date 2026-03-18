<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Ticket;

class TicketNumberGenerator
{
    public function generateForClient(Client $client): string
    {
        $clientName = strtolower(str_replace(' ', '', (string) $client->name));
        $date = now()->format('Y-m-d');
        $time = now()->format('H:i');

        $baseCode = $clientName.'-'.$date.'-'.$time.'-';

        $latest = Ticket::query()
            ->where('ticket_number', 'LIKE', $baseCode.'%')
            ->orderBy('ticket_number', 'DESC')
            ->first();

        $nextNum = '001';

        if ($latest) {
            $lastNum = (int) substr((string) $latest->ticket_number, -3);
            $nextNum = str_pad((string) ($lastNum + 1), 3, '0', STR_PAD_LEFT);
        }

        return $baseCode.$nextNum;
    }
}
