import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { BOX_VECTOR, testKey } from './fixtures.js';

const require = createRequire(import.meta.url);

describe('package exports', () => {
  it('decrypts responses through the CommonJS build', async () => {
    const sdk = require('../dist/index.cjs') as typeof import('../src/index.js');
    const key = await testKey();
    const client = new sdk.CngnClient({
      apiKey: 'cngn_test_example', encryptionKey: 'secret', privateKey: key.pem,
      fetch: async () => Response.json({ status: 200, data: BOX_VECTOR }),
    });
    expect(await client.verifyWithdrawal('ref-1'))
      .toEqual({ balance: '150000.00', asset_code: 'CNGN' });
    client.close();
  });
});
