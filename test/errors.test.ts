import { describe, expect, it } from 'vitest';
import { mapApiError } from '../src/errors.js';

describe('API errors', () => {
  it.each([
    [200, { status: 400, message: 'Invalid amount' }, 'validation', 400],
    [401, { message: 'Invalid token prefix' }, 'authentication', 401],
    [403, { message: 'IP address not whitelisted' }, 'ip_allowlist', 403],
    [400, { message: 'Missing encryption data, key, or IV' }, 'encryption', 400],
    [400, { message: 'Decryption failed' }, 'decryption', 400],
    [429, { message: 'Too many requests' }, 'rate_limit', 429],
    [503, { message: 'Service unavailable' }, 'service_unavailable', 503],
  ] as const)('maps HTTP %s failures', (httpStatus, payload, kind, expectedStatus) => {
    expect(mapApiError(httpStatus, payload)).toMatchObject({ kind, status: expectedStatus, response: payload });
  });
});
