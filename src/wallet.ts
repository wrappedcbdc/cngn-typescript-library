import { createECDH, createHash, createHmac, createPrivateKey, createPublicKey, randomBytes } from 'node:crypto';
import { inspect } from 'node:util';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { HDKey } from '@scure/bip32';
import * as bip39 from 'bip39';
import bs58 from 'bs58';

export enum Blockchain {
  EVM = 'evm',
  TRON = 'tron',
  SOL = 'sol',
  STELLAR = 'stellar',
  XBN = 'xbn',
}

export interface GeneratedWallet {
  blockchain: Blockchain;
  address: string;
  privateKey: string;
  mnemonic: string;
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const EVM_PATH = "m/44'/60'/0'/0/0";
const TRON_PATH = "m/44'/195'/0'/0/0";

function hmac(key: Uint8Array, data: Uint8Array): Buffer {
  return createHmac('sha512', key).update(data).digest();
}

function ed25519Seed(masterSeed: Uint8Array, path: readonly number[]): Buffer {
  let node = hmac(Buffer.from('ed25519 seed', 'ascii'), masterSeed);
  for (const index of path) {
    const data = Buffer.alloc(37);
    node.copy(data, 1, 0, 32);
    data.writeUInt32BE(index + 0x80000000, 33);
    const next = hmac(node.subarray(32), data);
    node.fill(0);
    data.fill(0);
    node = next;
  }
  const result = Buffer.from(node.subarray(0, 32));
  node.fill(0);
  return result;
}

function ed25519Public(seed: Uint8Array): Buffer {
  const prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
  const privateKey = createPrivateKey({ key: Buffer.concat([prefix, seed]), format: 'der', type: 'pkcs8' });
  const der = createPublicKey(privateKey).export({ format: 'der', type: 'spki' });
  return der.subarray(-32);
}

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

function evmAddress(publicKey: Uint8Array): string {
  const raw = Buffer.from(keccak_256(publicKey.subarray(1)).subarray(12)).toString('hex');
  const checksum = Buffer.from(keccak_256(Buffer.from(raw, 'ascii'))).toString('hex');
  return '0x' + [...raw].map((char, index) =>
    Number.parseInt(checksum[index] ?? '0', 16) >= 8 ? char.toUpperCase() : char).join('');
}

function tronAddress(evm: string): string {
  const payload = Buffer.concat([Buffer.from([0x41]), Buffer.from(evm.slice(2), 'hex')]);
  return bs58.encode(Buffer.concat([payload, sha256(sha256(payload)).subarray(0, 4)]));
}

function crc16(value: Uint8Array): number {
  let crc = 0;
  for (const byte of value) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

function strKey(version: number, key: Uint8Array): string {
  const payload = Buffer.concat([Buffer.from([version]), key]);
  const checksum = crc16(payload);
  const value = Buffer.concat([payload, Buffer.from([checksum & 255, checksum >>> 8])]);
  let bits = 0;
  let pending = 0;
  let encoded = '';
  for (const byte of value) {
    pending = (pending << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      encoded += BASE32[(pending >>> bits) & 31];
    }
  }
  if (bits) encoded += BASE32[(pending << (5 - bits)) & 31];
  return encoded;
}

function decodeBase32(value: string): Buffer {
  let bits = 0;
  let pending = 0;
  const bytes: number[] = [];
  for (const char of value) {
    const digit = BASE32.indexOf(char);
    if (digit < 0) throw new Error('Invalid base32');
    pending = (pending << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((pending >>> bits) & 255);
    }
  }
  if (bits && (pending & ((1 << bits) - 1))) throw new Error('Invalid base32 padding');
  return Buffer.from(bytes);
}

function redact(wallet: GeneratedWallet): GeneratedWallet {
  Object.defineProperty(wallet, inspect.custom, {
    value: () => `GeneratedWallet { blockchain: '${wallet.blockchain}', address: '${wallet.address}', secrets: '[redacted]' }`,
  });
  return wallet;
}

export class Wallets {
  static generate(blockchain: Blockchain): GeneratedWallet {
    return this.fromMnemonic(blockchain, bip39.entropyToMnemonic(randomBytes(32).toString('hex')));
  }

  static fromMnemonic(blockchain: Blockchain, mnemonic: string): GeneratedWallet {
    if (!Object.values(Blockchain).includes(blockchain)) throw new RangeError('Unsupported blockchain');
    if (!bip39.validateMnemonic(mnemonic)) throw new RangeError('Invalid BIP-39 mnemonic');
    const masterSeed = bip39.mnemonicToSeedSync(mnemonic);
    try {
      if (blockchain === Blockchain.EVM || blockchain === Blockchain.TRON) {
        const node = HDKey.fromMasterSeed(masterSeed).derive(
          blockchain === Blockchain.EVM ? EVM_PATH : TRON_PATH,
        );
        if (!node.privateKey) throw new Error('Could not derive private key');
        const privateKey = Buffer.from(node.privateKey);
        try {
          const ecdh = createECDH('secp256k1');
          ecdh.setPrivateKey(privateKey);
          const evm = evmAddress(ecdh.getPublicKey(undefined, 'uncompressed'));
          const address = blockchain === Blockchain.EVM ? evm : tronAddress(evm);
          return redact({ blockchain, address, privateKey: privateKey.toString('hex'), mnemonic });
        } finally {
          privateKey.fill(0);
        }
      }
      const path = blockchain === Blockchain.SOL ? [44, 501, 0, 0]
        : blockchain === Blockchain.STELLAR ? [44, 148, 0] : [44, 703, 0];
      const seed = ed25519Seed(masterSeed, path);
      try {
        const publicKey = ed25519Public(seed);
        if (blockchain === Blockchain.SOL) {
          const secret = Buffer.concat([seed, publicKey]);
          try {
            return redact({ blockchain, address: bs58.encode(publicKey),
              privateKey: bs58.encode(secret), mnemonic });
          } finally {
            secret.fill(0);
          }
        }
        return redact({ blockchain, address: strKey(0x30, publicKey),
          privateKey: strKey(0x90, seed), mnemonic });
      } finally {
        seed.fill(0);
      }
    } finally {
      masterSeed.fill(0);
    }
  }

  static validateAddress(blockchain: Blockchain, address: string): boolean {
    try {
      if (blockchain === Blockchain.EVM) {
        if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return false;
        const body = address.slice(2);
        if (body === body.toLowerCase() || body === body.toUpperCase()) return true;
        const hash = Buffer.from(keccak_256(Buffer.from(body.toLowerCase(), 'ascii'))).toString('hex');
        const expected = [...body.toLowerCase()].map((char, index) =>
          Number.parseInt(hash[index] ?? '0', 16) >= 8 ? char.toUpperCase() : char).join('');
        return body === expected;
      }
      if (blockchain === Blockchain.TRON) {
        const bytes = Buffer.from(bs58.decode(address));
        return bytes.length === 25 && bytes[0] === 0x41
          && bytes.subarray(21).equals(sha256(sha256(bytes.subarray(0, 21))).subarray(0, 4));
      }
      if (blockchain === Blockchain.SOL) return bs58.decode(address).length === 32;
      if (blockchain === Blockchain.STELLAR || blockchain === Blockchain.XBN) {
        const bytes = decodeBase32(address);
        const crc = crc16(bytes.subarray(0, 33));
        return bytes.length === 35 && bytes[0] === 0x30
          && bytes[33] === (crc & 255) && bytes[34] === (crc >>> 8);
      }
    } catch {
      return false;
    }
    return false;
  }
}
