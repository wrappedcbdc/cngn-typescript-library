import { describe, expect, it } from 'vitest';
import { CngnError } from '../src/errors.js';
import { decryptBody, decryptResponse, deriveAesKey, encryptBody, parseOpenSshKey } from '../src/crypto.js';
import { BOX_VECTOR, testKey } from './fixtures.js';

describe('crypto', () => {
  it('encrypts request data with a unique IV', () => {
    const key = deriveAesKey('secret');
    const first = encryptBody({ amount: 100, accountNumber: '0123456789' }, key);
    const second = encryptBody({ amount: 100, accountNumber: '0123456789' }, key);
    expect(first.iv).not.toBe(second.iv);
    expect(decryptBody(first, key)).toEqual({ amount: 100, accountNumber: '0123456789' });
    expect(() => decryptBody({ ...first, iv: 'invalid!' }, key)).toThrow(CngnError);
  });

  it('parses the OpenSSH private key and decrypts an authenticated response', async () => {
    const key = await testKey();
    const parsed = parseOpenSshKey(key.pem);
    expect(parsed.seed).toEqual(key.seed);
    expect(parsed.publicKey).toEqual(key.publicKey);
    expect(await decryptResponse(BOX_VECTOR, parsed.seed, parsed.publicKey))
      .toEqual({ balance: '150000.00', asset_code: 'CNGN' });
    const corrupted = Buffer.from(BOX_VECTOR, 'base64');
    corrupted[30] = (corrupted[30] ?? 0) ^ 1;
    await expect(decryptResponse(corrupted.toString('base64'), parsed.seed, parsed.publicKey))
      .rejects.toMatchObject({ kind: 'decryption' });
  });

  it('rejects malformed or encrypted key material', () => {
    expect(() => parseOpenSshKey('invalid')).toThrow(CngnError);
  });
});
