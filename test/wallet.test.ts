import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';
import { Blockchain, Wallets } from '../src/wallet.js';

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('wallets', () => {
  it.each([
    [Blockchain.EVM, '0x9858EfFD232B4033E47d90003D41EC34EcaEda94'],
    [Blockchain.TRON, 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH'],
    [Blockchain.SOL, 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk'],
    [Blockchain.STELLAR, 'GB3JDWCQJCWMJ3IILWIGDTQJJC5567PGVEVXSCVPEQOTDN64VJBDQBYX'],
    [Blockchain.XBN, 'GD7OOH7FGE25NJDQ67X23AB5IG6UGGOFV6HKOB6AKWTXFAXR262ZEAVB'],
  ])('derives a %s wallet', (blockchain, expectedAddress) => {
    const wallet = Wallets.fromMnemonic(blockchain, MNEMONIC);
    expect(wallet.address).toBe(expectedAddress);
    expect(wallet.privateKey.length).toBeGreaterThan(20);
    expect(Wallets.validateAddress(blockchain, wallet.address)).toBe(true);
    expect(inspect(wallet)).not.toContain(MNEMONIC);
  });

  it('rejects invalid input and malformed addresses', () => {
    expect(() => Wallets.fromMnemonic(Blockchain.EVM, 'invalid')).toThrow(RangeError);
    expect(Wallets.validateAddress(Blockchain.EVM, '0x123')).toBe(false);
    expect(Wallets.validateAddress(Blockchain.TRON, 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH!')).toBe(false);
    expect(Wallets.validateAddress(Blockchain.SOL, 'bad')).toBe(false);
    expect(Wallets.validateAddress(Blockchain.STELLAR, 'bad')).toBe(false);
    expect(Wallets.validateAddress(Blockchain.XBN, 'bad')).toBe(false);
  });

  it('generates a valid wallet', () => {
    const wallet = Wallets.generate(Blockchain.EVM);
    expect(Wallets.validateAddress(Blockchain.EVM, wallet.address)).toBe(true);
  });
});
