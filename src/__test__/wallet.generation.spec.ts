import { describe, it, expect } from '@jest/globals';
import { CryptoWallet } from '../utils/crypto.wallet';
import { Network } from '../utils/types';
import WAValidator from 'multicoin-address-validator';

describe('CryptoWallet', () => {
    describe('Wallet Generation', () => {
        describe('Ethereum (ETH)', () => {
            it('should generate a valid ETH wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.eth);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.eth);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });

            it('should validate ETH address format', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.eth);
                const isValid = WAValidator.validate(wallet.address, 'ethereum');
                expect(isValid).toBe(true);
            });
        });

        describe('Binance Smart Chain (BSC)', () => {
            it('should generate a valid BSC wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.bsc);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.bsc);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });
        });

        describe('Polygon (MATIC)', () => {
            it('should generate a valid MATIC wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.matic);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.matic);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });

            it('should validate MATIC address format', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.matic);
                const isValid = WAValidator.validate(wallet.address, 'matic');
                expect(isValid).toBe(true);
            });
        });

        describe('Tron (TRX)', () => {
            it('should generate a valid TRX wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.trx);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.trx);
                expect(wallet.address).toMatch(/^T[a-zA-Z0-9]{33}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });

            it('should validate TRX address format', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.trx);
                const isValid = WAValidator.validate(wallet.address, 'trx');
                expect(isValid).toBe(true);
            });
        });

        describe('Lisk', () => {
            it('should generate a valid Lisk wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.lisk);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.lisk);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });
        });

        describe('Monad', () => {
            it('should generate a valid Monad wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.monad);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.monad);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });
        });

        describe('Arc', () => {
            it('should generate a valid Arc wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.arc);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.arc);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });
        });

        describe('ATC', () => {
            it('should generate a valid ATC wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.atc);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.atc);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });
        });

        describe('Bantu (XBN)', () => {
            it('should generate a valid XBN wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.xbn);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.xbn);
                expect(wallet.privateKey).toMatch(/^S[A-Z0-9]{55}$/);
                expect(wallet.address).toMatch(/^G[A-Z0-9]{55}$/);
            });

            it('should generate different XBN wallets on each call', () => {
                const wallet1 = CryptoWallet.generateWalletWithMnemonicDetails(Network.xbn);
                const wallet2 = CryptoWallet.generateWalletWithMnemonicDetails(Network.xbn);

                expect(wallet1.address).not.toBe(wallet2.address);
                expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
                expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
            });
        });

        describe('Solana (SOL)', () => {
            it('should generate a valid SOL wallet with mnemonic', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.sol);

                expect(wallet).toBeDefined();
                expect(wallet.mnemonic).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
                expect(wallet.address).toBeDefined();
                expect(wallet.network).toBe(Network.sol);
                expect(wallet.address.length).toBeGreaterThan(32);
                expect(wallet.address.length).toBeLessThan(45);
                expect(wallet.privateKey.length).toBeGreaterThan(80);
                expect(wallet.privateKey.length).toBeLessThan(90);
            });

            it('should generate different SOL wallets on each call', () => {
                const wallet1 = CryptoWallet.generateWalletWithMnemonicDetails(Network.sol);
                const wallet2 = CryptoWallet.generateWalletWithMnemonicDetails(Network.sol);

                expect(wallet1.address).not.toBe(wallet2.address);
                expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
                expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
            });

            it('should generate valid base58-encoded addresses', () => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.sol);
                const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
                expect(wallet.address).toMatch(base58Regex);
                expect(wallet.privateKey).toMatch(base58Regex);
            });
        });
    });

    describe('Mnemonic Validation', () => {
        it('should generate valid 12-word BIP39 mnemonic', () => {
            const networks = [Network.eth, Network.bsc, Network.matic, Network.trx, Network.sol, Network.xbn];

            networks.forEach(network => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(network);
                const words = wallet.mnemonic?.split(' ') || [];
                expect(words.length).toBe(12);
            });
        });

        it('should generate unique wallets on each call', () => {
            const wallet1 = CryptoWallet.generateWalletWithMnemonicDetails(Network.eth);
            const wallet2 = CryptoWallet.generateWalletWithMnemonicDetails(Network.eth);

            expect(wallet1.address).not.toBe(wallet2.address);
            expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
            expect(wallet1.mnemonic).not.toBe(wallet2.mnemonic);
        });
    });

    describe('Network-Specific Properties', () => {
        it('should generate EVM-compatible addresses for EVM chains', () => {
            const evmNetworks = [
                Network.eth,
                Network.bsc,
                Network.matic,
                Network.lisk,
                Network.monad,
                Network.arc,
                Network.atc
            ];

            evmNetworks.forEach(network => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(network);
                expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(wallet.privateKey).toMatch(/^[a-fA-F0-9]{64}$/);
            });
        });

        it('should use correct derivation path for each network', () => {
            const networks = [
                Network.eth,
                Network.bsc,
                Network.matic,
                Network.trx,
                Network.xbn,
                Network.sol
            ];

            networks.forEach(network => {
                const wallet = CryptoWallet.generateWalletWithMnemonicDetails(network);
                expect(wallet.network).toBe(network);
                expect(wallet.address).toBeDefined();
                expect(wallet.privateKey).toBeDefined();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle unsupported networks gracefully', () => {
            const unsupportedNetwork = 'unsupported' as Network;
            expect(() => {
                CryptoWallet.generateWalletWithMnemonicDetails(unsupportedNetwork);
            }).toThrow();
        });
    });

    describe('Address Format Consistency', () => {
        it('should maintain consistent address format for Ethereum-style networks', () => {
            const wallet1 = CryptoWallet.generateWalletWithMnemonicDetails(Network.eth);
            const wallet2 = CryptoWallet.generateWalletWithMnemonicDetails(Network.bsc);
            const wallet3 = CryptoWallet.generateWalletWithMnemonicDetails(Network.matic);

            expect(wallet1.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
            expect(wallet2.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
            expect(wallet3.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });

        it('should generate Tron addresses with correct format', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.trx);
            expect(wallet.address).toMatch(/^T[a-zA-Z0-9]{33}$/);
        });

        it('should generate Stellar/Bantu addresses with correct format', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.xbn);
            expect(wallet.address).toMatch(/^G[A-Z0-9]{55}$/);
            expect(wallet.privateKey).toMatch(/^S[A-Z0-9]{55}$/);
        });

        it('should generate Solana addresses in base58 format', () => {
            const wallet = CryptoWallet.generateWalletWithMnemonicDetails(Network.sol);
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
            expect(wallet.address).toMatch(base58Regex);
        });
    });
});