# SSO Login API Documentation

## Purpose

Use this document to integrate any remote application with the CRM client portal SSO login. The remote application may be plain HTML/JavaScript, React, PHP, Laravel, ASP.NET, or any stack that can generate an encrypted token and open a URL in the user's browser.

The CRM SSO endpoint is a browser redirect endpoint, not a JSON API endpoint. The remote application creates a one-time encrypted login token, builds the SSO URL, and redirects the user to it.

## Quick Integration

1. Get the client's `client_code` and SSO secret from the CRM admin/client configuration.
2. Create a JSON payload with the client and user details.
3. Encrypt that payload using AES-256-GCM with the client's 32-byte SSO secret.
4. Build this URL:

```text
https://thisdomain/s/{client_code}?token={encrypted_token}
```

Example:

```text
https://thisdomain/s/RSCPL?token=v1.IvBase64Url.CiphertextBase64Url.TagBase64Url
```

5. Redirect the user to the URL or open it from a button/link.
6. CRM validates the token, logs in the organization user, and redirects the user to:

```text
/c/{client_code}/tickets
```

## Live Endpoint

```http
GET /s/{client_code}?token={encrypted_token}
```

Route name: `sso.consume`

This endpoint is currently implemented by:

- `app/Http/Controllers/ClientSsoController.php`
- `app/Services/ClientSsoTokenCipher.php`

## Authentication

No `X-API-KEY` header is used for the live SSO login link.

The login link is secured by the encrypted `token` query parameter. The token contains issue time, expiry time, and a unique `jti` value. Each `jti` can be used only once per client.

## Client Details API Note

The sample endpoint below is useful for remote applications that want to fetch CRM client configuration before building the SSO URL:

```http
GET /api/client/details?client_code=RSCPL
X-API-KEY: your-api-key
```

That endpoint is not currently present in this codebase. If it is added later, use this suggested response shape:

```json
{
  "success": true,
  "data": {
    "client_code": "RSCPL",
    "client_name": "RSCPL",
    "sso_enabled": true,
    "sso_url": "https://thisdomain/s/RSCPL"
  }
}
```

Do not return the client's `sso_secret` from this API. The SSO secret must be shared securely out-of-band with the trusted remote application only.

## Token Format

The encrypted token must use this format:

```text
v1.{base64url_iv}.{base64url_ciphertext}.{base64url_tag}
```

Parts:

| Part | Description |
| --- | --- |
| `v1` | Token version. Only `v1` is supported. |
| `base64url_iv` | 12-byte AES-GCM initialization vector, base64url encoded. |
| `base64url_ciphertext` | Encrypted JSON payload, base64url encoded. |
| `base64url_tag` | AES-GCM authentication tag, base64url encoded. |

Base64url means standard Base64 with `+` replaced by `-`, `/` replaced by `_`, and trailing `=` padding removed.

## Encryption

| Setting | Value |
| --- | --- |
| Algorithm | AES-256-GCM |
| Secret key | Base64-decoded client `sso_secret` |
| Raw key length | 32 bytes |
| IV length | 12 bytes |
| Token prefix | `v1` |

Generate the client secret like this:

```php
$ssoSecret = base64_encode(random_bytes(32));
```

Store this value in the CRM client's `sso_secret` field and give the same value securely to the trusted remote application.

## Payload

The decrypted token payload must be a JSON object.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ClientCode` | string | Yes | Must match `{client_code}` in the URL. |
| `ClientName` | string | No | Client organization name. Updates CRM client name if provided. |
| `ClientEmail` | string/email | No | Client email. Updates CRM client email if provided. |
| `ClientPhone` | string | No | Client phone. Updates CRM client phone if provided. |
| `UserLogin` | string | No | Remote app login/user identifier. Accepted but not used for lookup. |
| `UserName` | string | Yes | Organization user's full name. Used first for lookup. |
| `UserPhone` | string | No | Organization user's phone. |
| `UserEmail` | string/email | No | Organization user's email. Used as fallback lookup. |
| `iat` | integer | Yes | Unix timestamp when token was issued. |
| `exp` | integer | Yes | Unix timestamp when token expires. |
| `jti` | string | Yes | Unique token ID. Prevents replay/reuse. |

Recommended expiry: 2 to 5 minutes.

Example payload:

```json
{
  "ClientCode": "RSCPL",
  "ClientName": "RSCPL",
  "ClientEmail": "client@example.com",
  "ClientPhone": "+91 9876543210",
  "UserLogin": "john",
  "UserName": "John Smith",
  "UserPhone": "+91 9876543210",
  "UserEmail": "john@example.com",
  "iat": 1782477000,
  "exp": 1782477300,
  "jti": "f4df8e88a87f4fa99c7a7f3f4cb8ed6a"
}
```

## PHP Token Generation

```php
<?php

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function create_sso_token(array $payload, string $base64Secret): string
{
    $key = base64_decode($base64Secret, true);

    if ($key === false || strlen($key) !== 32) {
        throw new RuntimeException('SSO secret must be a base64-encoded 32-byte key.');
    }

    $iv = random_bytes(12);
    $tag = '';

    $ciphertext = openssl_encrypt(
        json_encode($payload, JSON_THROW_ON_ERROR),
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag
    );

    if ($ciphertext === false || $tag === '') {
        throw new RuntimeException('Unable to encrypt SSO token.');
    }

    return 'v1.'.base64url_encode($iv).'.'.base64url_encode($ciphertext).'.'.base64url_encode($tag);
}

$clientCode = 'RSCPL';
$ssoSecret = 'BASE64_32_BYTE_SECRET_FROM_CRM';
$now = time();

$payload = [
    'ClientCode' => $clientCode,
    'ClientName' => 'RSCPL',
    'UserLogin' => 'john',
    'UserName' => 'John Smith',
    'UserEmail' => 'john@example.com',
    'iat' => $now,
    'exp' => $now + 300,
    'jti' => bin2hex(random_bytes(16)),
];

$token = create_sso_token($payload, $ssoSecret);
$ssoUrl = 'https://thisdomain/s/'.rawurlencode($clientCode).'?token='.rawurlencode($token);

header('Location: '.$ssoUrl);
exit;
```

## Laravel Example

```php
use Illuminate\Support\Str;

$clientCode = 'RSCPL';
$ssoSecret = config('services.crm_sso.secret');
$now = now()->timestamp;

$payload = [
    'ClientCode' => $clientCode,
    'UserLogin' => auth()->user()->email,
    'UserName' => auth()->user()->name,
    'UserEmail' => auth()->user()->email,
    'iat' => $now,
    'exp' => $now + 300,
    'jti' => (string) Str::uuid(),
];

$token = create_sso_token($payload, $ssoSecret);

return redirect()->away("https://thisdomain/s/{$clientCode}?token=".urlencode($token));
```

Use the `create_sso_token` helper from the PHP example above, or implement the same AES-256-GCM/base64url logic as a Laravel service.

## HTML / JavaScript Usage

For plain HTML, generate the SSO URL on your backend and render it into the page. Do not expose the SSO secret in browser JavaScript.

```html
<a href="https://thisdomain/s/RSCPL?token=GENERATED_TOKEN">Open CRM</a>
```

Or:

```html
<button type="button" onclick="window.location.href = '/generate-crm-sso-link'">
    Open CRM
</button>
```

Your `/generate-crm-sso-link` route should generate the token server-side, then redirect to the CRM SSO URL.

## React Usage

React should ask your backend for a freshly generated link. The backend must create the encrypted token.

```tsx
async function openCrm(): Promise<void> {
  const response = await fetch('/api/crm/sso-link', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to create CRM SSO link');
  }

  const data: { url: string } = await response.json();
  window.location.href = data.url;
}
```

Example backend response:

```json
{
  "url": "https://thisdomain/s/RSCPL?token=v1.Iv.Ciphertext.Tag"
}
```

## ASP.NET C# Token Generation

```csharp
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

static string Base64UrlEncode(byte[] value)
{
    return Convert.ToBase64String(value)
        .TrimEnd('=')
        .Replace('+', '-')
        .Replace('/', '_');
}

static string CreateSsoToken(object payload, string base64Secret)
{
    byte[] key = Convert.FromBase64String(base64Secret);

    if (key.Length != 32)
    {
        throw new InvalidOperationException("SSO secret must decode to 32 bytes.");
    }

    byte[] iv = RandomNumberGenerator.GetBytes(12);
    byte[] plaintext = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
    byte[] ciphertext = new byte[plaintext.Length];
    byte[] tag = new byte[16];

    using var aes = new AesGcm(key, 16);
    aes.Encrypt(iv, plaintext, ciphertext, tag);

    return $"v1.{Base64UrlEncode(iv)}.{Base64UrlEncode(ciphertext)}.{Base64UrlEncode(tag)}";
}
```

## Success Behavior

When token validation succeeds, CRM will:

1. Find the client by `{client_code}`.
2. Confirm SSO is enabled and the SSO secret exists.
3. Decrypt and validate the token payload.
4. Confirm `ClientCode` matches the URL client code.
5. Reject expired, future-issued, malformed, or reused tokens.
6. Find an organization user by `UserName`, then fallback to `UserEmail`.
7. Create or restore the organization user if needed.
8. Log in using the `organization` guard.
9. Redirect the user to `/c/{client_code}/tickets`.

## Error Responses

The SSO endpoint is a browser endpoint, so errors are returned as standard HTTP error pages.

| Status | Reason |
| --- | --- |
| `404` | Client not found. |
| `403` | SSO disabled for the client. |
| `403` | SSO secret not configured. |
| `403` | Token already used. |
| `403` | User is inactive. |
| `422` | Missing token. |
| `422` | Invalid token format. |
| `422` | Invalid base64url encoding. |
| `422` | Unable to decrypt token. |
| `422` | Invalid decrypted payload. |
| `422` | Invalid token payload. |
| `422` | Client code mismatch. |
| `422` | Token not valid yet. |
| `422` | Token has expired. |

## Security Rules

- Generate the token on the remote application's backend only.
- Never expose the SSO secret in frontend JavaScript, React, HTML, mobile apps, or public code.
- Use HTTPS only.
- Use a short expiry, preferably 2 to 5 minutes.
- Generate a new `jti` for every login attempt.
- Do not reuse SSO links.
- Keep server clocks synchronized because the CRM allows only 60 seconds of clock skew.
- Store the SSO secret in environment/configuration storage, not hardcoded source files.
- Rotate the secret if it is exposed.

