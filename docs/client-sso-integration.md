# Client SSO Authentication Integration Guide

## Overview

This document provides integration instructions for third-party applications to authenticate users via the VASP CRM Single Sign-On (SSO) system.

---

## SSO Authentication Flow

### 1. SSO Endpoint

**URL:** `GET /s/{code}`

The SSO endpoint consumes authentication tokens and logs users into the client portal.

| Parameter | Type   | Required | Description                                   |
| --------- | ------ | -------- | --------------------------------------------- |
| `code`    | string | Yes      | Client code (e.g., `CODE1234`)                |
| `token`   | string | Yes      | Encrypted JWT-like token containing user data |

**Example URL:**

```
https://domain.com/s/CODE1234?token=v1.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Token Generation

Third-party applications must generate an encrypted token with the following payload:

```json
{
    "email": "user@example.com",
    "iat": 1699876543,
    "exp": 1699876843,
    "jti": "uuid-v4-string",
    "name": "John Doe",
    "designation": "operator",
    "phone": "+1234567890"
}
```

| Field         | Type    | Required | Description                       |
| ------------- | ------- | -------- | --------------------------------- |
| `email`       | string  | Yes      | User's email address              |
| `iat`         | integer | Yes      | Issued at timestamp (Unix epoch)  |
| `exp`         | integer | Yes      | Expiration timestamp (Unix epoch) |
| `jti`         | string  | Yes      | Unique token identifier (UUID v4) |
| `name`        | string  | No       | User's full name                  |
| `designation` | string  | No       | User's job title                  |
| `phone`       | string  | No       | User's phone number               |

### 3. Token Encryption

The token must be encrypted using **AES-256-GCM** with the client's SSO secret key.

**Token Format:** `v1.{iv}.{ciphertext}.{tag}`

Where:

- `v1` - Version identifier
- `iv` - 12-byte initialization vector (base64url encoded)
- `ciphertext` - Encrypted payload (base64url encoded)
- `tag` - Authentication tag (base64url encoded)

**PHP Example:**

```php
<?php

function generateSsoToken(array $payload, string $ssoSecret): string
{
    $key = base64_decode($ssoSecret, true);
    $iv = random_bytes(12);

    $tag = '';
    $ciphertext = openssl_encrypt(
        json_encode($payload),
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag
    );

    return 'v1.'
        . base64url_encode($iv) . '.'
        . base64url_encode($ciphertext) . '.'
        . base64url_encode($tag);
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}
```

**Node.js Example:**

```javascript
const crypto = require('crypto');

function generateSsoToken(payload, ssoSecret) {
    const key = Buffer.from(ssoSecret, 'base64');
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), 'utf8'),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();

    return 'v1.'
        + base64url(iv) + '.'
        + base64url(encrypted) + '.'
        + base64url(tag);
}

function base64url(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Usage
const payload = {
    email: 'user@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    jti: crypto.randomUUID(),
    name: 'John Doe',
    designation: 'operator',
    phone: '+1234567890'
};

const token = generateSsoToken(payload, 'YOUR_BASE64_ENCODED_SECRET');
console.log(token);
```

**C# (.NET) Example:**

```csharp
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public class SsoTokenGenerator
{
    public static string GenerateSsoToken(Dictionary<string, object> payload, string ssoSecret)
    {
        byte[] key = Convert.FromBase64String(ssoSecret);
        byte[] iv = new byte[12];
        RandomNumberGenerator.Fill(iv);

        string jsonPayload = JsonSerializer.Serialize(payload);
        byte[] plainBytes = Encoding.UTF8.GetBytes(jsonPayload);

        using var aes = new AesGcm(key, 16);
        byte[] cipherBytes = new byte[plainBytes.Length];
        byte[] tag = new byte[16];

        aes.Encrypt(iv, plainBytes, cipherBytes, tag);

        string token = $"v1.{Base64UrlEncode(iv)}.{Base64UrlEncode(cipherBytes)}.{Base64UrlEncode(tag)}";
        return token;
    }

    private static string Base64UrlEncode(byte[] data)
    {
        return Convert.ToBase64String(data)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}

// Usage
var payload = new Dictionary<string, object>
{
    { "email", "user@example.com" },
    { "iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds() },
    { "exp", DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds() },
    { "jti", Guid.NewGuid().ToString() },
    { "name", "John Doe" },
    { "designation", "operator" },
    { "phone", "+1234567890" }
};

string token = SsoTokenGenerator.GenerateSsoToken(payload, "YOUR_BASE64_ENCODED_SECRET");
Console.WriteLine(token);
```

### 4. Client Configuration

Each client must be configured with:

- **Client Code:** Unique identifier (e.g., `CODE1234`)
- **SSO Secret:** Base64-encoded 32-byte AES-256 key

Contact your administrator to obtain the client code and SSO secret.

---

## Adding Help/Support Links

### Option 1: Add Support URL to Client Model

To add a custom support URL for each client, add a new field to the Client model:

**Migration:**

```php
Schema::table('clients', function (Blueprint $table) {
    $table->string('support_url')->nullable()->after('sso_secret');
});
```

**Model Update (app/Models/Client.php):**

```php
protected $fillable = [
    // ... existing fields
    'support_url',
];
```

### Option 2: Pass Support URL in Token Payload

Include the support URL directly in the SSO token payload:

```json
{
    "email": "user@example.com",
    "iat": 1699876543,
    "exp": 1699876843,
    "jti": "uuid-v4-string",
    "support_url": "https://help.example.com"
}
```

**Controller Update (app/Http/Controllers/ClientSsoController.php):**

```php
// In consume() method, after successful authentication:
$supportUrl = $validated['support_url'] ?? null;
if ($supportUrl) {
    session(['client_support_url' => $supportUrl]);
}
```

### Option 3: Configure Global Support URL

Add a global support URL in your application's configuration:

**config/app.php:**

```php
return [
    // ...
    'support_url' => env('APP_SUPPORT_URL', 'https://help.yourdomain.com'),
];
```

---

## Integration Checklist

- [ ] Obtain client code from administrator
- [ ] Obtain SSO secret key from administrator
- [ ] Implement token encryption (AES-256-GCM)
- [ ] Generate unique JTI for each login attempt
- [ ] Set appropriate token expiration (recommended: 5 minutes)
- [ ] Handle redirect to SSO endpoint
- [ ] (Optional) Configure help/support URL

---

## Error Handling

The SSO endpoint returns the following HTTP status codes:

| Status Code | Description                              |
| ----------- | ---------------------------------------- |
| 403         | SSO is disabled or secret not configured |
| 422         | Invalid or expired token                 |
| 404         | Client not found                         |

---

## Security Considerations

1. **Token Expiration:** Keep tokens short-lived (5 minutes recommended)
2. **JTI Reuse Prevention:** Each JTI can only be used once
3. **HTTPS Only:** Always use HTTPS in production
4. **Secret Storage:** Store SSO secrets securely
5. **Clock Skew:** Allow 60 seconds of clock skew tolerance

---

## Support

For integration assistance, contact your system administrator or email support@yourdomain.com.
