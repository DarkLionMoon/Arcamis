import { describe, it, expect } from 'vitest';

describe('Password Hashing (Web Crypto)', () => {
  // Replicate the hash logic from admin.js for testing
  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashPassword(password, salt) {
    const combined = salt + ':' + password;
    const buf = new TextEncoder().encode(combined);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  it('should hash consistently with same salt', async () => {
    const salt = 'abc123def456';
    const h1 = await hashPassword('password123', salt);
    const h2 = await hashPassword('password123', salt);
    expect(h1).toBe(h2);
  });

  it('should produce different hashes for different salts', async () => {
    const h1 = await hashPassword('password123', 'salt1');
    const h2 = await hashPassword('password123', 'salt2');
    expect(h1).not.toBe(h2);
  });

  it('should produce different hashes for different passwords', async () => {
    const salt = 'abc123';
    const h1 = await hashPassword('password1', salt);
    const h2 = await hashPassword('password2', salt);
    expect(h1).not.toBe(h2);
  });

  it('should produce 64-char hex string', async () => {
    const hash = await hashPassword('test', 'salt');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('sha256 should produce consistent results', async () => {
    const h1 = await sha256('hello');
    const h2 = await sha256('hello');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it('sha256 should match known SHA-256 of empty string', async () => {
    const hash = await sha256('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
