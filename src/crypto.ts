import { createCipheriv, createDecipheriv, createHash, createPrivateKey, createPublicKey, randomBytes, timingSafeEqual } from 'node:crypto';
import sodium from 'libsodium-wrappers';
import { CngnError } from './errors.js';

export interface EncryptedBody {
  content: string;
  iv: string;
}

export function deriveAesKey(encryptionKey: string): Buffer {
  return createHash('sha256').update(encryptionKey, 'utf8').digest();
}

export function encryptBody(value: unknown, key: Uint8Array): EncryptedBody {
  let plaintext: Buffer | undefined;
  try {
    if (key.length !== 32) throw new Error('Expected a 32 byte key');
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    plaintext = Buffer.from(JSON.stringify(value), 'utf8');
    const content = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { content: content.toString('base64'), iv: iv.toString('base64') };
  } catch (cause) {
    throw new CngnError('encryption', 'Could not encrypt the request', undefined, undefined, { cause });
  } finally {
    plaintext?.fill(0);
  }
}

export function decryptBody(envelope: EncryptedBody, key: Uint8Array): unknown {
  let plaintext: Buffer | undefined;
  try {
    const iv = decodeBase64(envelope.iv);
    if (iv.length !== 16 || key.length !== 32) throw new Error('Invalid key or IV length');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    plaintext = Buffer.concat([
      decipher.update(decodeBase64(envelope.content)),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8')) as unknown;
  } catch (cause) {
    throw new CngnError('decryption', 'Could not decrypt the request body', undefined, undefined, { cause });
  } finally {
    plaintext?.fill(0);
  }
}

function decodeBase64(value: string): Buffer {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('Invalid base64');
  }
  return Buffer.from(value, 'base64');
}

class SshReader {
  private offset = 0;

  constructor(private readonly data: Buffer) {}

  readBytes(length: number): Buffer {
    if (length < 0 || length > this.data.length - this.offset) throw new Error('Truncated OpenSSH key');
    const value = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readInt(): number {
    return this.readBytes(4).readUInt32BE(0);
  }

  readString(): Buffer {
    return this.readBytes(this.readInt());
  }

  get remaining(): number {
    return this.data.length - this.offset;
  }
}

export function parseOpenSshKey(pem: string): { seed: Buffer; publicKey: Buffer } {
  const match = /^-----BEGIN OPENSSH PRIVATE KEY-----\s+([A-Za-z0-9+/=\s]+)\s+-----END OPENSSH PRIVATE KEY-----\s*$/.exec(pem);
  if (!match?.[1]) throw new CngnError('configuration', 'Expected an unencrypted OpenSSH Ed25519 private key');
  let blob: Buffer | undefined;
  try {
    blob = decodeBase64(match[1].replace(/\s+/g, ''));
    const reader = new SshReader(blob);
    if (reader.readBytes(15).toString('ascii') !== 'openssh-key-v1\0') throw new Error('Invalid OpenSSH key');
    if (reader.readString().toString('ascii') !== 'none') throw new Error('Encrypted OpenSSH keys are unsupported');
    if (reader.readString().toString('ascii') !== 'none' || reader.readString().length !== 0
        || reader.readInt() !== 1) throw new Error('Unsupported OpenSSH key format');
    const outerPublic = new SshReader(reader.readString());
    if (outerPublic.readString().toString('ascii') !== 'ssh-ed25519') throw new Error('Expected an Ed25519 key');
    const publicKey = outerPublic.readString();
    if (publicKey.length !== 32 || outerPublic.remaining !== 0) throw new Error('Invalid public key');
    const privateBlock = new SshReader(reader.readString());
    if (reader.remaining !== 0 || privateBlock.readInt() !== privateBlock.readInt()
        || privateBlock.readString().toString('ascii') !== 'ssh-ed25519') {
      throw new Error('Invalid private key block');
    }
    const innerPublic = privateBlock.readString();
    const secret = privateBlock.readString();
    if (innerPublic.length !== 32 || secret.length !== 64 || !timingSafeEqual(innerPublic, publicKey)
        || !timingSafeEqual(secret.subarray(32), publicKey)) {
      throw new Error('Public and private keys disagree');
    }
    privateBlock.readString();
    let padding = 1;
    while (privateBlock.remaining > 0) {
      if (privateBlock.readBytes(1)[0] !== padding++) throw new Error('Invalid OpenSSH padding');
    }
    const seed = Buffer.from(secret.subarray(0, 32));
    const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
    try {
      const derived = createPublicKey(createPrivateKey({ key: der, format: 'der', type: 'pkcs8' }))
        .export({ format: 'der', type: 'spki' }).subarray(-32);
      if (!timingSafeEqual(derived, publicKey)) {
        throw new Error('Private key does not match its public key');
      }
      return { seed, publicKey: Buffer.from(publicKey) };
    } catch (cause) {
      seed.fill(0);
      throw cause;
    } finally {
      der.fill(0);
    }
  } catch (cause) {
    throw new CngnError('configuration', 'Invalid OpenSSH Ed25519 private key', undefined, undefined, { cause });
  } finally {
    blob?.fill(0);
  }
}

export async function decryptResponse(encoded: string, seed: Uint8Array, publicKey: Uint8Array): Promise<unknown> {
  let privateKey: Uint8Array | undefined;
  let curveSecret: Uint8Array | undefined;
  let plaintext: Uint8Array | undefined;
  try {
    await sodium.ready;
    if (seed.length !== 32 || publicKey.length !== 32) throw new Error('Invalid Ed25519 key');
    const generated = sodium.crypto_sign_seed_keypair(seed);
    privateKey = generated.privateKey;
    if (!timingSafeEqual(Buffer.from(generated.publicKey), Buffer.from(publicKey))) {
      throw new Error('Private key does not match its public key');
    }
    const blob = decodeBase64(encoded);
    if (blob.length < 72) throw new Error('Response is too short');
    const nonce = blob.subarray(0, 24);
    const ciphertext = blob.subarray(24, -32);
    const ephemeralPublic = blob.subarray(-32);
    curveSecret = sodium.crypto_sign_ed25519_sk_to_curve25519(privateKey);
    plaintext = sodium.crypto_box_open_easy(ciphertext, nonce, ephemeralPublic, curveSecret);
    const parsed: unknown = JSON.parse(Buffer.from(plaintext).toString('utf8'));
    if (parsed === null || typeof parsed !== 'object') throw new Error('Expected JSON object or array');
    return parsed;
  } catch (cause) {
    throw new CngnError('decryption', 'Could not authenticate or decrypt the response', undefined, undefined, { cause });
  } finally {
    if (plaintext) sodium.memzero(plaintext);
    if (curveSecret) sodium.memzero(curveSecret);
    if (privateKey) sodium.memzero(privateKey);
  }
}
