import { describe, it, expect } from 'vitest';
import {
  sha256hex,
  constantTimeEqual,
  generateSalt,
  hashPassword,
  verifyPassword,
  genToken,
  parseCookie,
  rateLimitCheck,
} from '../api/_lib/auth.js';

describe('constantTimeEqual', () => {
  it('matches identical strings (different lengths and equal)', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
    expect(constantTimeEqual('', '')).toBe(true);
  });

  it('handles null/undefined gracefully', () => {
    expect(constantTimeEqual(null, null)).toBe(true);
    expect(constantTimeEqual(undefined, undefined)).toBe(true);
    expect(constantTimeEqual('x', null)).toBe(false);
  });
});

describe('sha256hex (Web Crypto)', () => {
  it('matches known SHA-256 of empty string', async () => {
    const hash = await sha256hex('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches known SHA-256 of "hello"', async () => {
    const hash = await sha256hex('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('produces 64-char lowercase hex', async () => {
    const hash = await sha256hex('arcamis-test');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });
});

describe('hashPassword (PBKDF2 salted)', () => {
  it('is deterministic with the same salt', async () => {
    const salt = '0123456789abcdef';
    const h1 = await hashPassword('password123', salt);
    const h2 = await hashPassword('password123', salt);
    expect(h1.hash).toBe(h2.hash);
    expect(h1.salt).toBe(salt);
  });

  it('produces different hashes for different salts', async () => {
    const a = await hashPassword('password123', 'salt-one');
    const b = await hashPassword('password123', 'salt-two');
    expect(a.hash).not.toBe(b.hash);
  });

  it('produces different hashes for different passwords', async () => {
    const a = await hashPassword('password-1', 'salt');
    const b = await hashPassword('password-2', 'salt');
    expect(a.hash).not.toBe(b.hash);
  });

  it('produces a 64-char hex hash', async () => {
    const { hash, salt } = await hashPassword('test', 'salt');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    expect(salt).toBe('salt');
  });

  it('generates a random salt when not provided', async () => {
    const a = await hashPassword('pass');
    const b = await hashPassword('pass');
    expect(a.salt).toHaveLength(32);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('verifyPassword (PBKDF2 salted)', () => {
  it('accepts the correct password', async () => {
    const { hash, salt } = await hashPassword('s3cr3t!');
    expect(await verifyPassword('s3cr3t!', hash, salt)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const { hash, salt } = await hashPassword('s3cr3t!');
    expect(await verifyPassword('wrong', hash, salt)).toBe(false);
  });
});

describe('genToken', () => {
  it('produces 64-char hex tokens and they differ', () => {
    const a = genToken();
    const b = genToken();
    expect(a).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(a)).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe('parseCookie', () => {
  it('extracts a cookie value from a header', () => {
    const header = 'foo=bar; arc_admin=abc123; other=1';
    expect(parseCookie(header, 'arc_admin')).toBe('abc123');
  });

  it('returns null when missing', () => {
    expect(parseCookie('foo=bar', 'arc_admin')).toBe(null);
    expect(parseCookie('', 'arc_admin')).toBe(null);
    expect(parseCookie(null, 'arc_admin')).toBe(null);
  });

  it('decodes URL-encoded values', () => {
    expect(parseCookie('arc_admin=a%20b', 'arc_admin')).toBe('a b');
  });

  it('does not match partial names', () => {
    const header = 'arc_admin_2=zz';
    expect(parseCookie(header, 'arc_admin')).toBe(null);
  });
});

describe('rateLimitCheck', () => {
  const makeKV = () => {
    const map = new Map();
    return {
      async get(key) {
        return map.has(key) ? map.get(key) : null;
      },
      async put(key, value) {
        map.set(key, value);
      },
    };
  };

  it('allows requests below the limit and blocks above', async () => {
    const kv = makeKV();
    for (let i = 0; i < 3; i++) {
      expect(await rateLimitCheck(kv, 'rl_x_ip', 3, 60)).toBe(false);
    }
    expect(await rateLimitCheck(kv, 'rl_x_ip', 3, 60)).toBe(true);
  });

  it('increments the stored counter', async () => {
    const kv = makeKV();
    await rateLimitCheck(kv, 'rl_y_ip', 10, 60);
    await rateLimitCheck(kv, 'rl_y_ip', 10, 60);
    const raw = await kv.get('rl_y_ip');
    expect(raw).toBe('2');
  });

  it('treats malformed counters as zero (hits limit naturally)', async () => {
    const kv = makeKV();
    await kv.put('rl_bad_ip', 'not-a-number');
    expect(await rateLimitCheck(kv, 'rl_bad_ip', 3, 60)).toBe(false);
  });
});
