import axios from 'axios';
import {Secrets, SwapParams, DepositParams, MintParams, WhiteListAddressParams, Network} from '../types';
import {cNGNManager} from "../index";
import {AESCrypto} from "../utils/aes.standard";
import {Ed25519Crypto} from "../utils/Ed25519.standard";

jest.mock('axios');
jest.mock('../utils/aes.standard');
jest.mock('../utils/Ed25519.standard');

describe('CNGnManager', () => {
    let manager: cNGNManager;
    let mockAxiosInstance: any;
    const mockSecrets: Secrets = {
        apiKey: 'test-api-key',
        privateKey: 'test-private-key',
        encryptionKey: 'test-encryption-key',
    };

    beforeEach(() => {
        mockAxiosInstance = {
            interceptors: {
                response: {
                    use: jest.fn(),
                },
            },
            request: jest.fn(),
        };
        (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
        manager = new cNGNManager(mockSecrets);
        jest.clearAllMocks();
    });

    describe('API calls', () => {
        const mockResponse = {
            data: {
                success: true,
                data: 'encrypted-data',
            },
        };

        beforeEach(() => {
            mockAxiosInstance.request.mockResolvedValue(mockResponse);
            (AESCrypto.encrypt as jest.Mock).mockReturnValue('encrypted-data');
            (Ed25519Crypto.decryptWithPrivateKey as jest.Mock).mockResolvedValue('{"decrypted":"data"}');
        });

        test('getBalance should make a GET request', async () => {
            await manager.getBalance();
            expect(mockAxiosInstance.request).toHaveBeenCalledWith({
                method: 'GET',
                url: '/balance',
                data: undefined,
            });
        });

        test('getTransactionHistory should make a GET request', async () => {
            await manager.getTransactionHistory();
            expect(mockAxiosInstance.request).toHaveBeenCalledWith({
                method: 'GET',
                url: '/transactions',
                data: undefined,
            });
        });

        test('swapBetweenChains should make a POST request with encrypted data', async () => {
            const swapParams: SwapParams = {
                amount: 100,
                address: 'test-address',
                network: Network.trx,
            };
            await manager.swapBetweenChains(swapParams);
            expect(AESCrypto.encrypt).toHaveBeenCalledWith(JSON.stringify(swapParams), mockSecrets.encryptionKey);
            expect(mockAxiosInstance.request).toHaveBeenCalledWith({
                method: 'POST',
                url: '/swap',
                data: 'encrypted-data',
            });
        });

        test('depositForRedemption should make a POST request with encrypted data', async () => {
            const depositParams: DepositParams = {
                amount: 100,
                bank: 'test-bank',
                accountNumber: '1234567890',
            };
            await manager.depositForRedemption(depositParams);
            expect(AESCrypto.encrypt).toHaveBeenCalledWith(JSON.stringify(depositParams), mockSecrets.encryptionKey);
            expect(mockAxiosInstance.request).toHaveBeenCalledWith({
                method: 'POST',
                url: '/deposit',
                data: 'encrypted-data',
            });
        });

        test('createVirtualAccount should make a POST request with encrypted data', async () => {
            const mintParams: MintParams = {
                provider: 'korapay',
            };
            await manager.createVirtualAccount(mintParams);
            expect(AESCrypto.encrypt).toHaveBeenCalledWith(JSON.stringify(mintParams), mockSecrets.encryptionKey);
            expect(mockAxiosInstance.request).toHaveBeenCalledWith({
                method: 'POST',
                url: '/createVirtualAccount',
                data: 'encrypted-data',
            });
        });

        test('whitelistAddress should make a POST request with encrypted data', async () => {
            const whitelistParams: WhiteListAddressParams = {
                xbnAddress: 'test-xbn-address',
            };
            await manager.whitelistAddress(whitelistParams);
            expect(AESCrypto.encrypt).toHaveBeenCalledWith(JSON.stringify(whitelistParams), mockSecrets.encryptionKey);
            expect(mockAxiosInstance.request).toHaveBeenCalledWith({
                method: 'POST',
                url: '/whiteListAddress',
                data: 'encrypted-data',
            });
        });
    });

    describe('Error handling', () => {
        test('should handle API errors', async () => {
            const errorResponse = {
                response: {
                    status: 400,
                    data: {
                        message: 'Bad Request',
                    },
                },
            };
            mockAxiosInstance.request.mockRejectedValue(errorResponse);

            await expect(manager.getBalance()).rejects.toThrow('API Error: 400 - Bad Request');
        });

        test('should handle network errors', async () => {
            const networkError = {
                request: {},
            };
            mockAxiosInstance.request.mockRejectedValue(networkError);

            await expect(manager.getBalance()).rejects.toThrow('No response received from API');
        });

        test('should handle unexpected errors', async () => {
            const unexpectedError = new Error('Unexpected error');
            mockAxiosInstance.request.mockRejectedValue(unexpectedError);

            await expect(manager.getBalance()).rejects.toThrow('Error setting up request: Unexpected error');
        });
    });
});