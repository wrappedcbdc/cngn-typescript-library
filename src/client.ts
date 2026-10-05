import { setTimeout as delay } from 'node:timers/promises';
import { deriveAesKey, decryptResponse, encryptBody, parseOpenSshKey } from './crypto.js';
import { CngnError, mapApiError } from './errors.js';
import type {
  AccountVerification, Balance, Bank, BankAccountRequest, BridgeQuote, BridgeQuoteRequest,
  BridgeRequest, BridgeResult, Network, RedeemRequest, RequestOptions, TemporaryAccount,
  TemporaryAccountRequest, Transaction, TransactionPage, TransferResult, VirtualAccount,
  WhitelistEntry, WithdrawRequest,
} from './types.js';

export const DEFAULT_BASE_URL = 'https://api.cngn.co/v1/api';

export interface ClientOptions {
  apiKey: string;
  encryptionKey: string;
  privateKey: string;
  environment?: 'test' | 'live';
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetch?: typeof fetch;
  sleep?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
}

type Method = 'GET' | 'POST' | 'PUT';
type Shape = 'array' | 'object' | 'any';
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

async function readResponse(response: Response): Promise<unknown> {
  const length = Number(response.headers.get('content-length'));
  if (length > MAX_RESPONSE_BYTES) {
    throw new CngnError('api', 'API response exceeds 10 MiB', response.status);
  }
  if (!response.body) throw new SyntaxError('Empty API response');
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new CngnError('api', 'API response exceeds 10 MiB', response.status);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks, size).toString('utf8')) as unknown;
}

function required(value: string, name: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new CngnError('configuration', `${name} is required`);
  }
  return value;
}

function positiveAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('amount must be positive and within the safe numeric range');
  }
  return value;
}

function validBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new CngnError('configuration', 'Invalid base URL', undefined, undefined, { cause });
  }
  const loopback = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !loopback) {
    throw new CngnError('configuration', 'Base URL must use HTTPS');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new CngnError('configuration', 'Base URL cannot contain credentials, query, or fragment');
  }
  return url.toString().replace(/\/$/, '');
}

export class CngnClient {
  readonly environment: 'test' | 'live';
  private readonly baseUrl: string;
  private readonly aesKey: Buffer;
  private readonly seed: Buffer;
  private readonly publicKey: Buffer;
  private readonly fetcher: typeof fetch;
  private readonly sleeper: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly apiKey: string;
  private closed = false;

  constructor(options: ClientOptions) {
    this.apiKey = required(options.apiKey, 'apiKey');
    const inferred = this.apiKey.startsWith('cngn_test_') ? 'test'
      : this.apiKey.startsWith('cngn_live_') ? 'live' : undefined;
    if (!inferred) throw new CngnError('configuration', 'API key must start with cngn_test_ or cngn_live_');
    if (options.environment && options.environment !== inferred) {
      throw new CngnError('configuration', 'API key and environment do not match');
    }
    this.environment = inferred;
    this.baseUrl = validBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 3;
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new CngnError('configuration', 'timeoutMs must be a positive integer');
    }
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0 || this.maxRetries > 10) {
      throw new CngnError('configuration', 'maxRetries must be between 0 and 10');
    }
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.sleeper = options.sleep ?? ((ms, signal) => delay(ms, undefined, { signal }));
    const encryptionKey = required(options.encryptionKey, 'encryptionKey');
    const key = parseOpenSshKey(required(options.privateKey, 'privateKey'));
    this.seed = key.seed;
    this.publicKey = key.publicKey;
    this.aesKey = deriveAesKey(encryptionKey);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.aesKey.fill(0);
    this.seed.fill(0);
    this.publicKey.fill(0);
  }

  private async request<T>(
    method: Method,
    path: string,
    shape: Shape,
    query?: Record<string, string | number>,
    body?: Record<string, unknown>,
    options: RequestOptions = {},
    safeToRetry = false,
  ): Promise<T> {
    if (this.closed) throw new CngnError('configuration', 'Client is closed');
    if (options.idempotencyKey !== undefined && (typeof options.idempotencyKey !== 'string'
        || !options.idempotencyKey.trim() || options.idempotencyKey !== options.idempotencyKey.trim())) {
      throw new CngnError('configuration', 'idempotencyKey must be a nonblank string without surrounding whitespace');
    }
    const url = new URL(this.baseUrl + path);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, String(value));
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    const wireBody = body === undefined ? undefined : JSON.stringify(encryptBody(body, this.aesKey));
    const retryAllowed = safeToRetry || Boolean(options.idempotencyKey);
    let attempt = 0;

    while (true) {
      try {
        const timeout = AbortSignal.timeout(this.timeoutMs);
        const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
        const response = await this.fetcher(url, {
          method, headers, ...(wireBody === undefined ? {} : { body: wireBody }),
          signal, redirect: 'error', cache: 'no-store',
        });
        let payload: unknown;
        try {
          payload = await readResponse(response);
        } catch (cause) {
          if (cause instanceof CngnError) throw cause;
          const kind = response.status === 429 ? 'rate_limit'
            : response.status >= 500 ? 'service_unavailable' : 'api';
          throw new CngnError(kind, 'Invalid API response', response.status, undefined, { cause });
        }
        if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new CngnError('api', 'Invalid API response envelope', response.status, payload);
        }
        const envelope = payload as Record<string, unknown>;
        const apiStatus = typeof envelope.status === 'number' ? envelope.status : response.status;
        if (!response.ok || apiStatus !== 200 || envelope.status === false) {
          throw mapApiError(response.status, envelope);
        }
        const data = typeof envelope.data === 'string'
          ? await decryptResponse(envelope.data, this.seed, this.publicKey)
          : envelope.data;
        const value = shape === 'any' ? data : data ?? (shape === 'array' ? [] : {});
        if (shape === 'array' && !Array.isArray(value)) {
          throw new CngnError('api', 'Expected an array in the API response', response.status, envelope);
        }
        if (shape === 'object' && (value === null || typeof value !== 'object' || Array.isArray(value))) {
          throw new CngnError('api', 'Expected an object in the API response', response.status, envelope);
        }
        return value as T;
      } catch (cause) {
        if (options.signal?.aborted) throw cause;
        const error = cause instanceof CngnError ? cause
          : new CngnError('network', 'cNGN request failed', undefined, undefined, { cause });
        const transient = error.kind === 'network' || error.kind === 'rate_limit'
          || error.kind === 'service_unavailable';
        if (!retryAllowed || !transient || attempt >= this.maxRetries) throw error;
        const waitMs = error.kind === 'rate_limit' ? 60_000 : Math.min(1000 * 2 ** attempt, 30_000);
        attempt++;
        await this.sleeper(waitMs, options.signal);
      }
    }
  }

  getBalance(options: RequestOptions = {}): Promise<Balance[]> {
    return this.request('GET', '/balance', 'array', undefined, undefined, options, true);
  }

  getTransactions(page = 1, limit = 10, options: RequestOptions = {}): Promise<TransactionPage> {
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      throw new RangeError('page and limit must be positive integers');
    }
    return this.request('GET', '/transactions', 'object', { page, limit }, undefined, options, true);
  }

  async *iterateTransactions(limit = 100, options: RequestOptions = {}): AsyncGenerator<Transaction> {
    for (let page = 1; ; page++) {
      const result = await this.getTransactions(page, limit, options);
      for (const transaction of result.data) yield transaction;
      if (result.pagination.isLastPage || result.data.length === 0) return;
    }
  }

  getNetworks(includeBlockchain = false, options: RequestOptions = {}): Promise<Network[]> {
    return this.request('GET', '/networks', 'array',
      includeBlockchain ? { includeBlockchain: 'true' } : undefined, undefined, options, true);
  }

  getVirtualAccounts(options: RequestOptions = {}): Promise<VirtualAccount[]> {
    return this.request('GET', '/virtual-account', 'array', undefined, undefined, options, true);
  }

  createTemporaryVirtualAccount(input: TemporaryAccountRequest, options: RequestOptions = {}): Promise<TemporaryAccount> {
    positiveAmount(input.amount);
    const body = {
      amount: input.amount,
      customer: { email: required(input.customer.email, 'customer.email'), name: required(input.customer.name, 'customer.name') },
      accountName: required(input.accountName, 'accountName'),
      ...(input.narration === undefined ? {} : { narration: input.narration }),
    };
    return this.request('POST', '/virtual-account/temporary', 'object', undefined, body, options);
  }

  redeemAsset(input: RedeemRequest, options: RequestOptions = {}): Promise<TransferResult> {
    const body = {
      amount: positiveAmount(input.amount), bankCode: required(input.bankCode, 'bankCode'),
      accountNumber: required(input.accountNumber, 'accountNumber'), saveDetails: input.saveDetails ?? false,
    };
    return this.request('POST', '/redeemAsset', 'object', undefined, body, options);
  }

  verifyBankAccount(bankCode: string, accountNumber: string, options: RequestOptions = {}): Promise<AccountVerification> {
    return this.request('POST', '/account/verify', 'object', undefined,
      { bankCode: required(bankCode, 'bankCode'), accountNumber: required(accountNumber, 'accountNumber') }, options, true);
  }

  getBanks(options: RequestOptions = {}): Promise<Bank[]> {
    return this.request('GET', '/banks', 'array', undefined, undefined, options, true);
  }

  updateBankAccount(input: BankAccountRequest): Promise<unknown> {
    const body = {
      bankName: required(input.bankName, 'bankName'),
      bankAccountName: required(input.bankAccountName, 'bankAccountName'),
      bankAccountNumber: required(input.bankAccountNumber, 'bankAccountNumber'),
    };
    return this.request('PUT', '/bank-account', 'any', undefined, body);
  }

  withdraw(input: WithdrawRequest, options: RequestOptions = {}): Promise<TransferResult> {
    const body = {
      amount: positiveAmount(input.amount), address: required(input.address, 'address'),
      networkId: required(input.networkId, 'networkId'), shouldSaveAddress: input.shouldSaveAddress ?? false,
    };
    return this.request('POST', '/withdraw', 'object', undefined, body, options);
  }

  verifyWithdrawal(reference: string, options: RequestOptions = {}): Promise<Transaction> {
    const segment = required(reference, 'reference');
    if (segment === '.' || segment === '..') throw new RangeError('Invalid withdrawal reference');
    return this.request('GET', `/withdraw/verify/${encodeURIComponent(segment)}`,
      'object', undefined, undefined, options, true);
  }

  getBridgeQuote(input: BridgeQuoteRequest, options: RequestOptions = {}): Promise<BridgeQuote> {
    const body = {
      amount: positiveAmount(input.amount),
      originNetworkId: required(input.originNetworkId, 'originNetworkId'),
      destinationNetworkId: required(input.destinationNetworkId, 'destinationNetworkId'),
      destinationAddress: required(input.destinationAddress, 'destinationAddress'),
    };
    return this.request('POST', '/bridge-quote', 'object', undefined, body, options, true);
  }

  bridge(input: BridgeRequest, options: RequestOptions = {}): Promise<BridgeResult> {
    const body = {
      originNetworkId: required(input.originNetworkId, 'originNetworkId'),
      destinationNetworkId: required(input.destinationNetworkId, 'destinationNetworkId'),
      destinationAddress: required(input.destinationAddress, 'destinationAddress'),
      ...(input.senderAddress === undefined ? {} : { senderAddress: input.senderAddress }),
      ...(input.callbackUrl === undefined ? {} : { callbackUrl: input.callbackUrl }),
    };
    return this.request('POST', '/bridge', 'object', undefined, body, options);
  }

  whitelistAddress(networkId: string, address: string): Promise<unknown> {
    return this.request('POST', '/whitelist', 'any', undefined,
      { networkId: required(networkId, 'networkId'), address: required(address, 'address') });
  }

  getWhitelistedAddresses(includeNetwork = false, options: RequestOptions = {}): Promise<WhitelistEntry[]> {
    return this.request('GET', '/whitelisted', 'array',
      includeNetwork ? { includeNetwork: 'true' } : undefined, undefined, options, true);
  }
}
