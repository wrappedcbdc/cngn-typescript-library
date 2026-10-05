import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseWebhook, verifyWebhook } from '../src/webhooks.js';

describe('webhooks', () => {
  const body = Buffer.from('{"event":"withdrawal.completed","data":{"reference":"wd-1"}}');
  const secret = 'webhook-secret';
  const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  it('verifies the raw body signature', () => {
    expect(verifyWebhook(body, signature, secret)).toBe(true);
    expect(verifyWebhook(Buffer.from(body.toString() + ' '), signature, secret)).toBe(false);
    expect(verifyWebhook(body, 'sha256=bad', secret)).toBe(false);
    expect(verifyWebhook(body, undefined, secret)).toBe(false);
  });

  it('parses valid events', () => {
    expect(parseWebhook(body).data.reference).toBe('wd-1');
    expect(() => parseWebhook(Buffer.from('{"event":"x","data":[]}')))
      .toThrowError('Invalid webhook payload');
  });
});
