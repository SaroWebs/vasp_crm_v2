<?php

namespace Tests\Unit;

use App\Services\NotificationService;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    public function test_format_whatsapp_is_group_returns_true_for_boolean_true(): void
    {
        $service = new class extends NotificationService {
            public function publicFormatWhatsAppIsGroup(bool|string $isGroup): string
            {
                return $this->formatWhatsAppIsGroup($isGroup);
            }
        };

        $this->assertSame('true', $service->publicFormatWhatsAppIsGroup(true));
    }

    public function test_format_whatsapp_is_group_returns_false_for_boolean_false(): void
    {
        $service = new class extends NotificationService {
            public function publicFormatWhatsAppIsGroup(bool|string $isGroup): string
            {
                return $this->formatWhatsAppIsGroup($isGroup);
            }
        };

        $this->assertSame('false', $service->publicFormatWhatsAppIsGroup(false));
    }

    public function test_format_whatsapp_is_group_converts_string_values_correctly(): void
    {
        $service = new class extends NotificationService {
            public function publicFormatWhatsAppIsGroup(bool|string $isGroup): string
            {
                return $this->formatWhatsAppIsGroup($isGroup);
            }
        };

        $this->assertSame('true', $service->publicFormatWhatsAppIsGroup('true'));
        $this->assertSame('false', $service->publicFormatWhatsAppIsGroup('false'));
        $this->assertSame('true', $service->publicFormatWhatsAppIsGroup('1'));
        $this->assertSame('false', $service->publicFormatWhatsAppIsGroup('0'));
        $this->assertSame('false', $service->publicFormatWhatsAppIsGroup(''));    
    }
}
