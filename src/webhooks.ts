import { createHmac, timingSafeEqual } from 'node:crypto';
import { CngnError } from './errors.js';

export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp?: string;
  [key: string]: unknown;
}

export function verifyWebhook(rawBody: Uint8Array, signature: string | undefined, secret: string): boolean {
  if (!signature?.startsWith('sha256=') || !secret.trim()) return false;
  const hex = signature.slice(7).trim();
  if (!/^[a-fA-F0-9]{64}$/.test(hex)) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(hex, 'hex'));
}

export function parseWebhook(rawBody: Uint8Array): WebhookEvent {
  try {
    const value: unknown = JSON.parse(Buffer.from(rawBody).toString('utf8'));
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid envelope');
    const event = value as Record<string, unknown>;
    if (typeof event.event !== 'string' || event.data === null || typeof event.data !== 'object'
        || Array.isArray(event.data)) throw new Error('Invalid envelope');
    return value as WebhookEvent;
  } catch (cause) {
    throw new CngnError('validation', 'Invalid webhook payload', undefined, undefined, { cause });
  }
}
