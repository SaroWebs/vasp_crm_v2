<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Ticket;

class TicketNumberGenerator
{
    public function generateForClient(Client $client): string
    {
        // Step 1: Generate XXX (Client Identifier)
        $words = preg_split('/\s+/', trim($client->name));
        $wordCount = count($words);

        if ($wordCount >= 3) {
            // Take first letter of first 3 words
            $identifier = strtoupper(
                substr($words[0], 0, 1).
                substr($words[1], 0, 1).
                substr($words[2], 0, 1)
            );
        } elseif ($wordCount == 2) {
            // Take first 2 letters of each word
            $identifier = strtoupper(
                substr($words[0], 0, 2).
                substr($words[1], 0, 2)
            );
        } else {
            // Single word → first 3 letters
            $identifier = strtoupper(substr($words[0], 0, 3));
        }

        // Step 2: Year
        $year = now()->format('Y');

        // Step 3: Base Pattern
        $baseCode = $identifier.'/'.$year.'/';

        // Step 4: Get latest ticket
        $latest = Ticket::query()
            ->where('ticket_number', 'LIKE', $baseCode.'%')
            ->orderBy('ticket_number', 'DESC')
            ->first();

        // Step 5: Generate next serial
        $nextNum = '0000001';

        if ($latest) {
            $lastNum = (int) substr($latest->ticket_number, -7);
            $nextNum = str_pad((string) ($lastNum + 1), 7, '0', STR_PAD_LEFT);
        }

        return $baseCode.$nextNum;
    }
}
