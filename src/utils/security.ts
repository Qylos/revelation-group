/**
 * ============================================================================
 * REVELATION GROUP — CYBER SECURITY HARDENING UTILITIES
 * ============================================================================
 * - Cryptographic SHA-256 Hashing (Synchronous, zero-dependency)
 * - Salted Password Verification & Upgrade
 * - URL & Image Sanitization (Anti-XSS)
 * - CSV / Excel Formula Injection Sanitization
 */

/**
 * Standard SHA-256 implementation in pure TypeScript/JavaScript.
 * Runs synchronously across all environments without external npm libraries.
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  // Initial hash values: first 32 bits of the fractional parts of the square roots of the first 8 primes
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x3910c423, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let i: number;
  let j: number;

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = [];

  for (i = 0; i < words.length; i += 16) {
    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[j + i] || 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = ((w[j - 16] + gamma0) | 0) + ((w[j - 7] + gamma1) | 0);
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((h + s1) | 0) + ch) | 0) + k[j] + (w[j] || 0)) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

const PASSWORD_SALT = 'rev_secure_salt_v1_';

/**
 * Hashes password with application salt to prevent rainbow table attacks.
 */
export function hashPassword(plainPassword: string): string {
  if (!plainPassword) return '';
  return sha256(PASSWORD_SALT + plainPassword.trim());
}

/**
 * Verifies password against stored password, supporting:
 * 1. Salted SHA-256 hash
 * 2. Unsalted SHA-256 hash
 * 3. Legacy plaintext (for graceful migration)
 */
export function verifyPassword(inputPassword: string, storedPassword?: string): boolean {
  if (!storedPassword) return true; // Account has no password set yet
  const trimmed = inputPassword.trim();
  if (storedPassword === hashPassword(trimmed)) return true;
  if (storedPassword === sha256(trimmed)) return true;
  if (storedPassword === trimmed) return true;
  return false;
}

/**
 * Validates that an image URL uses safe protocols (prevents javascript:, data:text/html, etc.)
 */
export function isSafeImageUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('javascript:') || clean.startsWith('vbscript:') || clean.startsWith('data:text/')) {
    return false;
  }
  if (clean.startsWith('data:image/') || clean.startsWith('https://') || clean.startsWith('http://')) {
    return true;
  }
  return false;
}

/**
 * Neutralizes CSV / Excel Formula Injection by escaping characters =, +, -, @, tab, or carriage return.
 */
export function sanitizeExcelValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
}
