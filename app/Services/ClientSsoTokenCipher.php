<?php

namespace App\Services;

use App\Models\Client;

class ClientSsoTokenCipher
{
    /**
     * @return array<string, mixed>
     */
    public function decryptV1(Client $client, string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 4 || $parts[0] !== 'v1') {
            abort(422, 'Invalid token format.');
        }

        [, $ivPart, $cipherPart, $tagPart] = $parts;

        $iv = $this->base64UrlDecode($ivPart);
        $ciphertext = $this->base64UrlDecode($cipherPart);
        $tag = $this->base64UrlDecode($tagPart);

        $key = $this->clientKey($client);

        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($plaintext === false) {
            abort(422, 'Unable to decrypt token.');
        }

        $decoded = json_decode($plaintext, true);
        if (! is_array($decoded)) {
            abort(422, 'Invalid decrypted payload.');
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function encryptV1(Client $client, array $payload): string
    {
        $key = $this->clientKey($client);
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
            abort(500, 'Unable to encrypt token.');
        }

        return 'v1.'
            .$this->base64UrlEncode($iv).'.'
            .$this->base64UrlEncode($ciphertext).'.'
            .$this->base64UrlEncode($tag);
    }

    private function clientKey(Client $client): string
    {
        $rawKey = base64_decode((string) $client->sso_secret, true);
        if ($rawKey === false || strlen($rawKey) !== 32) {
            abort(500, 'Client SSO secret must be a base64-encoded 32-byte key.');
        }

        return $rawKey;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $value = str_replace(['-', '_'], ['+', '/'], $value);
        $padLength = (4 - (strlen($value) % 4)) % 4;
        $value .= str_repeat('=', $padLength);

        $decoded = base64_decode($value, true);
        if ($decoded === false) {
            abort(422, 'Invalid base64url encoding.');
        }

        return $decoded;
    }
}
