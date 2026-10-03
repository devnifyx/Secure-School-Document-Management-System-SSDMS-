<?php

namespace App\Services;

class FileEncryptionService
{
    private const CIPHER = 'aes-256-cbc';

    // returns the IV + ciphertext to store, the base64 key and a SHA-256 of the plaintext
    public function encrypt(string $plaintext): array
    {
        $key = random_bytes(32);
        $iv = random_bytes(openssl_cipher_iv_length(self::CIPHER));
        $encrypted = openssl_encrypt($plaintext, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);

        return [
            'content' => $iv . $encrypted,
            'key' => base64_encode($key),
            'hash' => hash('sha256', $plaintext),
        ];
    }

    public function decrypt(string $storedContent, string $base64Key): string
    {
        $key = base64_decode($base64Key);
        $ivLength = openssl_cipher_iv_length(self::CIPHER);
        $iv = substr($storedContent, 0, $ivLength);
        $encrypted = substr($storedContent, $ivLength);

        return openssl_decrypt($encrypted, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);
    }
}
