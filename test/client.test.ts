import { describe, expect, it, vi } from 'vitest';
import { CngnClient } from '../src/client.js';
import { decryptBody, deriveAesKey } from '../src/crypto.js';
import { BOX_VECTOR, testKey, success } from './fixtures.js';

async function client(fetcher: typeof fetch, overrides: Record<string, unknown> = {}): Promise<CngnClient> {
  const key = await testKey();
  return new CngnClient({
    apiKey: 'cngn_test_example', encryptionKey: 'secret', privateKey: key.pem,
    fetch: fetcher, sleep: async () => {}, ...overrides,
  });
}

describe('CngnClient', () => {
  it('validates configuration before sending requests', async () => {
    await expect(client(vi.fn(), { apiKey: 'invalid' })).rejects.toMatchObject({ kind: 'configuration' });
    await expect(client(vi.fn(), { environment: 'live' })).rejects.toMatchObject({ kind: 'configuration' });
    await expect(client(vi.fn(), { baseUrl: 'http://api.example.com' })).rejects.toMatchObject({ kind: 'configuration' });
    await expect(client(vi.fn(), { maxRetries: -1 })).rejects.toMatchObject({ kind: 'configuration' });
  });

  it('rejects amounts outside the safe numeric range', async () => {
    const sdk = await client(vi.fn());
    expect(() => sdk.withdraw({ amount: Number.MAX_SAFE_INTEGER + 1,
      address: '0xabc', networkId: 'network-1' })).toThrow(RangeError);
  });

  it('sends authenticated requests to the expected paths', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => success([]));
    const sdk = await client(fetcher);
    await sdk.getBalance();
    await sdk.getNetworks(true);
    await sdk.getWhitelistedAddresses(true);
    expect(fetcher).toHaveBeenCalledTimes(3);
    const [balanceUrl, balanceInit] = fetcher.mock.calls[0]!;
    expect(String(balanceUrl)).toBe('https://api.cngn.co/v1/api/balance');
    expect(new Headers(balanceInit?.headers).get('Authorization')).toBe('Bearer cngn_test_example');
    expect(balanceInit?.body).toBeUndefined();
    expect(String(fetcher.mock.calls[1]![0])).toContain('includeBlockchain=true');
    expect(String(fetcher.mock.calls[2]![0])).toContain('includeNetwork=true');
    sdk.close();
    await expect(sdk.getBanks()).rejects.toMatchObject({ kind: 'configuration' });
  });

  it('encrypts endpoint payloads and attaches idempotency keys', async () => {
    const calls: Array<{ path: string; body: unknown; key?: string; method: string }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      const url = new URL(String(input));
      const headers = new Headers(init?.headers);
      const encrypted = JSON.parse(String(init?.body)) as { content: string; iv: string };
      const entry: { path: string; body: unknown; key?: string; method: string } = {
        path: url.pathname, body: decryptBody(encrypted, deriveAesKey('secret')),
        method: String(init?.method),
      };
      const key = headers.get('Idempotency-Key');
      if (key) entry.key = key;
      calls.push(entry);
      return success({});
    };
    const sdk = await client(fetcher);
    await sdk.createTemporaryVirtualAccount({ amount: 100, customer: { email: 'a@example.com', name: 'Ada' }, accountName: 'Ada' }, { idempotencyKey: 'req-1' });
    await sdk.redeemAsset({ amount: 100, bankCode: '001', accountNumber: '0123456789' });
    await sdk.verifyBankAccount('001', '0123456789');
    await sdk.updateBankAccount({ bankName: 'Bank', bankAccountName: 'Ada', bankAccountNumber: '0123456789' });
    await sdk.withdraw({ amount: 5, address: '0xabc', networkId: 'network-1' }, { idempotencyKey: 'req-2' });
    await sdk.getBridgeQuote({ amount: 5, originNetworkId: 'a', destinationNetworkId: 'b', destinationAddress: 'dest' });
    await sdk.bridge({ originNetworkId: 'a', destinationNetworkId: 'b', destinationAddress: 'dest' }, { idempotencyKey: 'req-3' });
    await sdk.whitelistAddress('network-1', 'dest');
    expect(calls.map(call => [call.method, call.path])).toEqual([
      ['POST', '/v1/api/virtual-account/temporary'], ['POST', '/v1/api/redeemAsset'],
      ['POST', '/v1/api/account/verify'], ['PUT', '/v1/api/bank-account'],
      ['POST', '/v1/api/withdraw'], ['POST', '/v1/api/bridge-quote'],
      ['POST', '/v1/api/bridge'], ['POST', '/v1/api/whitelist'],
    ]);
    expect(calls[0]).toMatchObject({ key: 'req-1', body: { amount: 100, customer: { email: 'a@example.com', name: 'Ada' }, accountName: 'Ada' } });
    expect(calls[1]?.body).toEqual({ amount: 100, bankCode: '001', accountNumber: '0123456789', saveDetails: false });
    expect(calls[4]).toMatchObject({ key: 'req-2', body: { amount: 5, address: '0xabc', networkId: 'network-1', shouldSaveAddress: false } });
    expect(calls[6]?.key).toBe('req-3');
  });

  it('retries reads and keyed transfers while leaving unkeyed transfers alone', async () => {
    let attempts = 0;
    const fetcher: typeof fetch = async () => {
      attempts++;
      if (attempts === 1 || attempts === 3 || attempts === 4) {
        return Response.json({ status: 503, message: 'Unavailable' }, { status: 503 });
      }
      return success(attempts === 2 ? [] : {});
    };
    const sdk = await client(fetcher, { maxRetries: 1 });
    await sdk.getBanks();
    expect(attempts).toBe(2);
    await expect(sdk.redeemAsset({ amount: 1, bankCode: '1', accountNumber: '1234567890' }))
      .rejects.toMatchObject({ kind: 'service_unavailable' });
    expect(attempts).toBe(3);
    await sdk.redeemAsset({ amount: 1, bankCode: '1', accountNumber: '1234567890' }, { idempotencyKey: 'req-4' });
    expect(attempts).toBe(5);
  });

  it('waits through the rate limit window before retrying', async () => {
    let attempts = 0;
    const sleep = vi.fn(async (_milliseconds: number) => {});
    const fetcher: typeof fetch = async () => {
      attempts++;
      return attempts === 1
        ? Response.json({ status: 429, message: 'Too many requests' }, { status: 429 })
        : success([]);
    };
    const sdk = await client(fetcher, { maxRetries: 1, sleep });
    await sdk.getBanks();
    expect(sleep).toHaveBeenCalledWith(60_000, undefined);
  });

  it('preserves API errors and rejects invalid response shapes', async () => {
    const badAuth = await client(async () => Response.json({ status: 401, message: 'Invalid token prefix' }, { status: 401 }));
    await expect(badAuth.getBalance()).rejects.toMatchObject({ kind: 'authentication', status: 401 });
    const invalid = await client(async () => success({ balance: 10 }));
    await expect(invalid.getBalance()).rejects.toMatchObject({ kind: 'api' });
  });

  it('limits response size even without a content-length header', async () => {
    const large = await client(async () => new Response('x', {
      headers: { 'content-length': String(10 * 1024 * 1024 + 1) },
    }));
    await expect(large.getBanks()).rejects.toMatchObject({ kind: 'api', message: 'API response exceeds 10 MiB' });

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(10 * 1024 * 1024 + 1));
      },
    });
    const streamed = await client(async () => new Response(stream));
    await expect(streamed.getBanks()).rejects.toMatchObject({ kind: 'api', message: 'API response exceeds 10 MiB' });
  });

  it('passes cancellation signals to read requests', async () => {
    const signal = new AbortController().signal;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => success([]));
    const sdk = await client(fetcher);
    await sdk.getBalance({ signal });
    expect(fetcher.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('decrypts encrypted response data', async () => {
    const sdk = await client(async () => success(BOX_VECTOR));
    const data = await sdk.verifyWithdrawal('reference-1');
    expect(data).toEqual({ balance: '150000.00', asset_code: 'CNGN' });
  });

  it('preserves empty raw responses', async () => {
    const sdk = await client(async () => success(null));
    expect(await sdk.whitelistAddress('network-1', '0xabc')).toBeNull();
  });

  it('iterates transaction pages and escapes withdrawal references', async () => {
    const urls: string[] = [];
    const fetcher: typeof fetch = async input => {
      urls.push(String(input));
      if (String(input).includes('/withdraw/verify/')) return success({ trx_ref: 'a/b' });
      const page = new URL(String(input)).searchParams.get('page');
      return success({ data: [{ trx_ref: `tx-${page}` }], pagination: { count: 1, pages: 2, isLastPage: page === '2', nextPage: null, previousPage: null } });
    };
    const sdk = await client(fetcher);
    const refs: string[] = [];
    for await (const transaction of sdk.iterateTransactions()) refs.push(String(transaction.trx_ref));
    expect(refs).toEqual(['tx-1', 'tx-2']);
    await sdk.verifyWithdrawal('a/b');
    expect(urls[2]).toContain('/withdraw/verify/a%2Fb');
    expect(() => sdk.verifyWithdrawal('..')).toThrow(RangeError);
  });
});
