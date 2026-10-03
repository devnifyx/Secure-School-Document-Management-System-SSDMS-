<?php

namespace Tests\Unit;

use App\Services\FileEncryptionService;
use PHPUnit\Framework\TestCase;

class FileEncryptionServiceTest extends TestCase
{
    private FileEncryptionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new FileEncryptionService();
    }

    public function test_encrypt_returns_ciphertext_key_and_hash(): void
    {
        $result = $this->service->encrypt('exam paper contents');

        $this->assertSame(['content', 'key', 'hash'], array_keys($result));
        $this->assertSame(32, strlen(base64_decode($result['key'], true)));
        $this->assertSame(hash('sha256', 'exam paper contents'), $result['hash']);
        $this->assertSame(64, strlen($result['hash']));
        $this->assertStringNotContainsString('exam paper contents', $result['content']);
        // 16-byte IV followed by whole 16-byte AES blocks
        $this->assertSame(0, strlen($result['content']) % 16);
        $this->assertGreaterThan(16, strlen($result['content']));
    }

    public function test_decrypt_restores_the_exact_original_bytes(): void
    {
        $binary = random_bytes(5000) . "\x00\xFF" . str_repeat('A', 100);
        $result = $this->service->encrypt($binary);

        $this->assertSame($binary, $this->service->decrypt($result['content'], $result['key']));
    }

    public function test_every_encryption_uses_a_new_key_and_iv(): void
    {
        $a = $this->service->encrypt('same plaintext');
        $b = $this->service->encrypt('same plaintext');

        $this->assertNotSame($a['key'], $b['key']);
        $this->assertNotSame($a['content'], $b['content']);
        $this->assertSame($a['hash'], $b['hash']);
    }

    public function test_decrypting_with_the_wrong_key_does_not_return_the_plaintext(): void
    {
        $plain = str_repeat('confidential ', 50);
        $result = $this->service->encrypt($plain);
        $wrongKey = base64_encode(random_bytes(32));

        $this->assertNotSame($plain, $this->service->decrypt($result['content'], $wrongKey));
    }

    public function test_decrypting_corrupted_ciphertext_does_not_return_the_plaintext(): void
    {
        $plain = str_repeat('confidential ', 50);
        $result = $this->service->encrypt($plain);
        $corrupted = substr($result['content'], 0, -1) . chr(ord(substr($result['content'], -1)) ^ 0xFF);

        $this->assertNotSame($plain, $this->service->decrypt($corrupted, $result['key']));
    }
}
