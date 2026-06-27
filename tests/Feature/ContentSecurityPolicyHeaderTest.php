<?php

namespace Tests\Feature;

use Tests\TestCase;

class ContentSecurityPolicyHeaderTest extends TestCase
{
    public function test_web_responses_allow_same_origin_connect_requests_in_report_only_csp(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertHeader('Content-Security-Policy-Report-Only');

        $policy = $response->headers->get('Content-Security-Policy-Report-Only');

        $this->assertIsString($policy);
        $this->assertStringContainsString("connect-src 'self'", $policy);
        $this->assertStringNotContainsString("connect-src 'none'", $policy);
    }
}
