# Client SSO Authentication Integration Guide

This application uses a custom AES-256-GCM encrypted token (not a standard JWT) for SSO.

**SSO URL Format:**
```
https://domain.com/s/{CLIENT_CODE}?token={SSO_TOKEN}

Example: https://domain.com/s/2325?token=v1.7Q8...g4vA
```

## Token Payload (JSON)

The client app must encrypt this JSON payload into a token:

```json
{
    "ClientCode": "2325",
    "ClientName": "ABC Comp",
    "ClientEmail": "abc@gmail.com",
    "ClientPhone": "999999999",
    "UserLogin": "usernameforlogin",
    "UserName": "John Doe",
    "UserPhone": "9556669999",
    "UserEmail": "johndoe@abc.com",
    "iat": 1699876543,
    "exp": 1699876843,
    "jti": "uuid-v4-string"
}
```

**Payload Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ClientCode` | string | Yes | Must match the `{CLIENT_CODE}` path param |
| `ClientName` | string | No | Client organization name (used for updates) |
| `ClientEmail` | string | No | Client email (used for updates) |
| `ClientPhone` | string | No | Client phone number (used for updates) |
| `UserLogin` | string | No | Accepted but not used for authentication |
| `UserName` | string | Yes | User's full name |
| `UserPhone` | string | No | User's phone number |
| `UserEmail` | string | Yes | User's email address (used for user lookup/creation) |
| `iat` | integer | Yes | Issued-at timestamp (Unix epoch seconds) |
| `exp` | integer | Yes | Expiration timestamp (Unix epoch seconds) |
| `jti` | string | Yes | Unique token ID (UUID v4 recommended) |

**Validation Rules & Behavior:**

- `ClientCode` must exactly match the `{CLIENT_CODE}` in the URL.
- `iat` cannot be more than 60 seconds in the future.
- `exp` cannot be more than 60 seconds in the past.
- `jti` is single-use per client. Reuse is rejected.
- Users are matched by `UserEmail` (case-insensitive); if missing, login fails.
- If the user is inactive, the login is blocked.

## Token Encryption

The payload must be encrypted using **AES-256-GCM** with the client's SSO secret key.

**Token Format:** `v1.{iv}.{ciphertext}.{tag}`

Where:

- `v1` - Version identifier
- `iv` - 12-byte initialization vector (base64url encoded, no padding)
- `ciphertext` - Encrypted payload (base64url encoded, no padding)
- `tag` - Authentication tag (base64url encoded, no padding)

## Client Configuration

Each client must be configured with:

- **Client Code:** Unique identifier (e.g., `CODE1234`)
- **SSO Secret:** Base64-encoded 32-byte AES-256 key

Contact your administrator to obtain the client code and SSO secret.

## Typical Flow

1. Client app builds the payload.
2. Client app encrypts the payload to create `{SSO_TOKEN}`.
3. Client app redirects the user to `https://domain.com/s/{CLIENT_CODE}?token={SSO_TOKEN}`.

## Integration Checklist

- [ ] Obtain client code from administrator
- [ ] Obtain SSO secret key from administrator
- [ ] Implement token encryption (AES-256-GCM)
- [ ] Generate a unique `jti` for each login attempt
- [ ] Set `exp` to a short window (recommended: 5 minutes)
- [ ] Redirect to the SSO endpoint URL

## Error Handling

The SSO endpoint returns the following HTTP status codes:

| Status Code | Description |
| ----------- | ----------- |
| 403 | SSO is disabled or secret not configured |
| 403 | This link has already been used |
| 403 | This user is inactive |
| 404 | Client not found |
| 422 | Missing token |
| 422 | Invalid token format or base64url |
| 422 | Invalid token payload |
| 422 | Client code mismatch |
| 422 | Token not valid yet |
| 422 | Token has expired |

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

// Usage - New Payload Format
const payload = {
    ClientCode: '2325',
    ClientName: 'ABC Comp',
    ClientEmail: 'abc@gmail.com',
    ClientPhone: '999999999',
    UserLogin: 'usernameforlogin',
    UserName: 'John Doe',
    UserPhone: '9556669999',
    UserEmail: 'johndoe@abc.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    jti: crypto.randomUUID()
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

// Usage - New Payload Format
var payload = new Dictionary<string, object>
{
    { "ClientCode", "2325" },
    { "ClientName", "ABC Comp" },
    { "ClientEmail", "abc@gmail.com" },
    { "ClientPhone", "999999999" },
    { "UserLogin", "usernameforlogin" },
    { "UserName", "John Doe" },
    { "UserPhone", "9556669999" },
    { "UserEmail", "johndoe@abc.com" },
    { "iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds() },
    { "exp", DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds() },
    { "jti", Guid.NewGuid().ToString() }
};

string token = SsoTokenGenerator.GenerateSsoToken(payload, "YOUR_BASE64_ENCODED_SECRET");
Console.WriteLine(token);
```

**Python Example:**

```python
import os
import base64
import json
import time
import uuid
from Crypto.Cipher import AES

def base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def generate_sso_token(payload, sso_secret):
    key = base64.b64decode(sso_secret)
    iv = os.urandom(12)

    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(json.dumps(payload).encode('utf-8'))

    return f"v1.{base64url_encode(iv)}.{base64url_encode(ciphertext)}.{base64url_encode(tag)}"

# Usage - New Payload Format
payload = {
    'ClientCode': '2325',
    'ClientName': 'ABC Comp',
    'ClientEmail': 'abc@gmail.com',
    'ClientPhone': '999999999',
    'UserLogin': 'usernameforlogin',
    'UserName': 'John Doe',
    'UserPhone': '9556669999',
    'UserEmail': 'johndoe@abc.com',
    'iat': int(time.time()),
    'exp': int(time.time()) + 300,
    'jti': str(uuid.uuid4())
}

token = generate_sso_token(payload, 'YOUR_BASE64_ENCODED_SECRET')
print(token)
```
