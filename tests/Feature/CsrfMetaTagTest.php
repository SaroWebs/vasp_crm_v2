<?php

namespace Tests\Feature;

use Tests\TestCase;

class CsrfMetaTagTest extends TestCase
{
    public function test_app_shell_includes_csrf_meta_tag(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('<meta name="csrf-token" content="', false);
    }
}
