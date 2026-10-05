export type ErrorKind =
  | 'configuration'
  | 'authentication'
  | 'ip_allowlist'
  | 'permission'
  | 'rate_limit'
  | 'validation'
  | 'not_found'
  | 'service_unavailable'
  | 'api'
  | 'network'
  | 'encryption'
  | 'decryption';

export class CngnError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    message: string,
    public readonly status?: number,
    public readonly response?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'CngnError';
  }
}

export function mapApiError(status: number, payload: Record<string, unknown>): CngnError {
  const apiStatus = typeof payload.status === 'number' ? payload.status : status;
  const message = typeof payload.message === 'string' ? payload.message : `HTTP ${apiStatus}`;
  const lower = message.toLowerCase();
  const kind: ErrorKind =
    status === 429 || apiStatus === 429 || lower.includes('too many requests') ? 'rate_limit'
    : lower.includes('ip address') && (lower.includes('whitelist') || lower.includes('determine')) ? 'ip_allowlist'
    : lower.includes('permission denied') ? 'permission'
    : status === 401 || apiStatus === 401 || lower.includes('token') || lower.includes('merchant not found')
      || lower.includes('ssh key found') ? 'authentication'
    : lower.includes('missing encryption data') ? 'encryption'
    : lower.includes('decryption failed') ? 'decryption'
    : status === 404 || apiStatus === 404 || lower.includes('transaction not found') ? 'not_found'
    : status === 400 || apiStatus === 400 ? 'validation'
    : status >= 500 || apiStatus >= 500 ? 'service_unavailable'
    : 'api';
  return new CngnError(kind, message, apiStatus, payload);
}
