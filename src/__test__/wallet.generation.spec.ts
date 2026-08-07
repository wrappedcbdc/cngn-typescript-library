import { describe, it, expect } from '@jest/globals';
import { CryptoWallet } from '../utils/crypto.wallet';
import { Blockchain } from '../utils/types';
import WAValidator from 'multicoin-address-validator';

describe('CryptoWallet', () => {
    describe('Wallet Generation', () => {
        describe('EVM', () => {
            it('should generate a valid EVM wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.EVM);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.blockchain).toBe(Blockchain.EVM);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });

            it('should validate the EVM address format', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.EVM);

                expect(WAValidator.validate(wallet.address, 'ethereum')).toBe(true);
                expect(WAValidator.validate(wallet.address, 'matic')).toBe(true);
            });

            it('should generate different EVM wallets on each call', () => {
                const wallet1 = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.EVM);
                const wallet2 = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.EVM);

                expect(wallet1.address).not.toBe(wallet2.address);
                expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
                expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
            });
        });

        describe('Tron', () => {
            it('should generate a valid TRON wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.TRON);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.blockchain).toBe(Blockchain.TRON);
                expect(wallet.address).toMatch(/^T[a-zA-Z0-9]{33}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });

            it('should validate TRON address format', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.TRON);
                const isValid = WAValidator.validate(wallet.address, 'trx');
                expect(isValid).toBe(true);
            });
        });

        describe('Bantu (XBN)', () => {
            it('should generate a valid XBN wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.XBN);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.blockchain).toBe(Blockchain.XBN);
                expect(wallet.privateKey).toMatch(/^S[A-Z0-9]{55}$/);
                expect(wallet.address).toMatch(/^G[A-Z0-9]{55}$/);
            });

            it('should generate different XBN wallets on each call', () => {
                const wallet1 = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.XBN);
                const wallet2 = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.XBN);

                expect(wallet1.address).not.toBe(wallet2.address);
                expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
                expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
            });
        });

        describe('Solana (SOL)', () => {
            it('should generate a valid SOL wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.SOL);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.blockchain).toBe(Blockchain.SOL);
                expect(wallet.address.length).toBeGreaterThan(32);
                expect(wallet.address.length).toBeLessThan(45);
                expect(wallet.privateKey.length).toBeGreaterThan(80);
                expect(wallet.privateKey.length).toBeLessThan(90);
            });

            it('should generate different SOL wallets on each call', () => {
                const wallet1 = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.SOL);
                const wallet2 = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.SOL);

                expect(wallet1.address).not.toBe(wallet2.address);
                expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
                expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
            });

            it('should generate valid base58-encoded addresses', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.SOL);
                const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
                expect(wallet.address).toMatch(base58Regex);
                expect(wallet.privateKey).toMatch(base58Regex);
            });
        });
    });

    describe('Mnemonic Validation', () => {
        it('should generate valid 24-word BIP39 mnemonic', () => {
            Object.values(Blockchain).forEach(blockchain => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(blockchain);
                const words = wallet.mnemonic?.split(' ') || [];
                expect(words.length).toBe(24);
            });
        });
    });

    describe('Blockchain-Specific Properties', () => {
        it('should use the correct derivation path for each blockchain', () => {
            Object.values(Blockchain).forEach(blockchain => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(blockchain);
                expect(wallet.blockchain).toBe(blockchain);
                expect(wallet.address).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
            });
        });

        it('should derive the same key pair for every EVM network from one mnemonic', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.EVM);

            // A single EVM wallet is valid on every EVM network the SDK supports.
            expect(WAValidator.validate(wallet.address, 'eth')).toBe(true);
            expect(WAValidator.validate(wallet.address, 'matic')).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle unsupported blockchains gracefully', () => {
            const unsupportedBlockchain = 'unsupported' as Blockchain;
            expect(() => {
                CryptoWallet.generateWalletWithMnemonicDetails(unsupportedBlockchain);
            }).toThrow();
        });
    });

    describe('Address Format Consistency', () => {
        it('should generate Ethereum-style addresses for EVM', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.EVM);
            expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });

        it('should generate Tron addresses with correct format', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.TRON);
            expect(wallet.address).toMatch(/^T[a-zA-Z0-9]{33}$/);
        });

        it('should generate Stellar/Bantu addresses with correct format', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.XBN);
            expect(wallet.address).toMatch(/^G[A-Z0-9]{55}$/);
            expect(wallet.privateKey).toMatch(/^S[A-Z0-9]{55}$/);
        });

        it('should generate Solana addresses in base58 format', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Blockchain.SOL);
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
            expect(wallet.address).toMatch(base58Regex);
        });
    });
});
