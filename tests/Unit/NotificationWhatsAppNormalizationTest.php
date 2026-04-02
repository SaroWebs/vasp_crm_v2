<?php

namespace Tests\Unit;

use App\Services\NotificationService;
use Tests\TestCase;

class NotificationWhatsAppNormalizationTest extends TestCase
{
    public function test_whatsapp_phone_normalization_strips_non_digits_and_adds_country_code(): void
    {
        $service = new class extends NotificationService
        {
            public function normalize(string $phone): ?string
            {
                return $this->normalizeWhatsAppPhoneNumber($phone);
            }
        };

        $this->assertSame('919876543210', $service->normalize('+91 98765-43210'));
        $this->assertSame('919876543210', $service->normalize('9876543210'));
        $this->assertNull($service->normalize('abc'));
    }
}
