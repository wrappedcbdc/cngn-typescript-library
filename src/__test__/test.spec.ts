import axios from 'axios';
import {
    Secrets,
    IResponse,
    Balance,
    Transactions,
    IWithdraw,
    RedeemAsset,
    IVirtualAccount,
    ExternalAccounts,
    IBanks,
    TrxType,
    AssetType,
    Status,
    UpdateExternalAccount,
    IWithdrawResponse,
    Swap,
    SwapResponse,
    ITransactionPagination,
    ISwapQuoteResponse,
    ISwapQuote,
    WalletAccount,
    WhiteListAddress,
    BankAccount,
    VerifyBankAccount,
    VerifyBankAccountResponse,
    SupportedNetworks
} from '../utils/types';
import {cNGNManager} from "../services/cngn.manager";
import {describe} from "@jest/globals";

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock encryption utilities
jest.mock('../utils/aes.standard');
jest.mock('../utils/Ed25519.standard');

describe('cNGNManager', () => {
    let manager: cNGNManager;
    const mockSecrets: Secrets = {
        apiKey: 'test-api-key',
        privateKey: 'test-private-key',
        encryptionKey: 'test-encryption-key'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedAxios.create.mockReturnValue(mockedAxios);
        manager = new cNGNManager(mockSecrets);
    });

    describe('Constructor', () => {
        it('should create axios instance with correct configuration', () => {
            expect(mockedAxios.create).toHaveBeenCalledWith({
                baseURL: 'https://api.cngn.co/v1/api',
                headers: {
                    'Authorization': 'Bearer test-api-key',
                    'Content-Type': 'application/json'
                }
            });
        });
    });

    describe('API Calls', () => {
        describe('getBalance', () => {
            it('should fetch balance successfully', async () => {
                const mockBalance: Balance[] = [{
                    asset_type: 'fiat',
                    asset_code: 'NGN',
                    balance: '1000.00'
                }];

                const mockResponse: IResponse<Balance[]> = {
                    success: true,
                    data: mockBalance
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getBalance();
                expect(result).toEqual(mockResponse);
                expect(mockedAxios.request).toHaveBeenCalledWith({
                    method: 'GET',
                    url: '/balance',
                    data: undefined
                });
            });
        });

        describe('getTransactionHistory', () => {
            it('should fetch transaction history successfully', async () => {
                const mockTransactions: ITransactionPagination = {
                    data: [
                        {
                            id: "txn_123456789",
                            from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                            receiver: {
                                address: "0x123f3a3c58292d1c3eb40808c6412e5a1231234"
                            },
                            amount: "0.5",
                            description: "Transfer ETH to wallet",
                            createdAt: "2024-03-21T14:30:00Z",
                            trx_ref: "ETH_TXN_001",
                            trx_type: TrxType.withdraw,
                            network: 'eth',
                            asset_type: AssetType.fiat,
                            asset_symbol: "ETH",
                            base_trx_hash: "0xabcd1234...",
                            extl_trx_hash: "0xefgh5678...",
                            explorer_link: "https://etherscan.io/tx/0xabcd1234...",
                            status: Status.completed
                        }
                    ],
                    pagination: {
                        count: 1,
                        pages: 1,
                        isLastPage: true,
                        nextPage: null,
                        previousPage: null
                    }
                };

                const mockResponse: IResponse<ITransactionPagination> = {
                    success: true,
                    data: mockTransactions
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getTransactionHistory();
                expect(result).toEqual(mockResponse);
            });
        });

        describe('withdraw', () => {
            it('should process withdrawal successfully', async () => {
                const withdrawData: IWithdraw = {
                    amount: 1000,
                    address: '0x789...',
                    networkId: 'bsc',
                    shouldSaveAddress: true
                };

                const mockWithdraw: IWithdrawResponse = {
                    trxRef: 'TRX123',
                    address: '0x789...'
                };

                const mockResponse: IResponse<IWithdrawResponse> = {
                    success: true,
                    data: mockWithdraw
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.withdraw(withdrawData);
                expect(result).toEqual(mockResponse);
            });
        });

        describe("Verify Withdrawal", () => {
            it('should verify transaction reference', async () => {
                const mockVerification: Transactions = {
                    id: "txn_123456789",
                    from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    receiver: {
                        address: "0x123f3a3c58292d1c3eb40808c6412e5a1231234"
                    },
                    amount: "0.5",
                    description: "Transfer ETH to wallet",
                    createdAt: "2024-03-21T14:30:00Z",
                    trx_ref: "ETH_TXN_001",
                    trx_type: TrxType.withdraw,
                    network: 'eth',
                    asset_type: AssetType.fiat,
                    asset_symbol: "ETH",
                    base_trx_hash: "0xabcd1234...",
                    extl_trx_hash: "0xefgh5678...",
                    explorer_link: "https://etherscan.io/tx/0xabcd1234...",
                    status: Status.completed
                };

                const mockResponse: IResponse<Transactions> = {
                    success: true,
                    data: mockVerification
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.verifyWithdrawal(mockVerification.trx_ref);
                expect(result).toEqual(mockResponse);
            });
        })

        describe('getVirtualAccount', () => {
            it('should get virtual account successfully', async () => {
                const mockVirtualAccount: IVirtualAccount = {
                    accountNumber: '1234567890',
                    accountName: 'Test Account',
                    bankCode: '123',
                    bankName: 'Test Bank'
                };

                const mockResponse: IResponse<IVirtualAccount> = {
                    success: true,
                    data: mockVirtualAccount
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getVirtualAccount();
                expect(result).toEqual(mockResponse);
                expect(mockedAxios.request).toHaveBeenCalledWith({
                    method: 'GET',
                    url: '/virtual-account',
                    data: undefined
                });
            });
        });

        describe('getBanks', () => {
            it('should fetch banks successfully', async () => {
                const mockBanks: IBanks[] = [
                    {
                        name: 'Test Bank',
                        slug: 'test-bank',
                        code: '123',
                        country: 'NG',
                        nibss_bank_code: '123456'
                    },
                ]

                const mockResponse: IResponse<IBanks[]> = {
                    success: true,
                    data: mockBanks
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getBanks();
                expect(result).toEqual(mockResponse);
            });
        });

        describe('redeemAsset', () => {
            it('should process redemption successfully', async () => {
                const redeemData: RedeemAsset = {
                    amount: 1000,
                    bankCode: '123',
                    accountNumber: '1234567890',
                    saveDetails: true
                };

                const mockTransaction: Transactions = {
                    id: "txn_123456789",
                    from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    receiver: {
                        address: "0x123f3a3c58292d1c3eb40808c6412e5a1231234"
                    },
                    amount: "0.5",
                    description: "Transfer ETH to wallet",
                    createdAt: "2024-03-21T14:30:00Z",
                    trx_ref: "ETH_TXN_001",
                    trx_type: TrxType.fiat_redeem,
                    network: 'eth',
                    asset_type: AssetType.fiat,
                    asset_symbol: "ETH",
                    base_trx_hash: "0xabcd1234...",
                    extl_trx_hash: "0xefgh5678...",
                    explorer_link: "https://etherscan.io/tx/0xabcd1234...",
                    status: Status.completed
                };

                const mockResponse: IResponse<Transactions> = {
                    success: true,
                    data: mockTransaction
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.redeemAsset(redeemData);
                expect(result).toEqual(mockResponse);
            });
        });

        describe('swapAsset', () => {
            it('should process swap successfully', async () => {
                const swapData: Swap = {
                    destinationNetworkId: 'bsc',
                    destinationAddress: '0x789...',
                    originNetworkId: 'bsc',
                    callbackUrl: 'https://test-callback.com',
                    senderAddress: "0x789..."
                };

                const mockSwapResponse: SwapResponse = {
                    receivableAddress: '0x789...',
                    transactionId: 'TRX123',
                    reference: 'REF123'
                };

                const mockResponse: IResponse<SwapResponse> = {
                    success: true,
                    data: mockSwapResponse
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.swapAsset(swapData);
                expect(result).toEqual(mockResponse);
            });
        });

        describe("Get Swap Quote", () => {
            it('should fetch swap quote successfully', async () => {
                const swapQuoteData: ISwapQuote = {
                    destinationNetworkId: 'bsc',
                    destinationAddress: '0x789...',
                    originNetworkId: 'eth',
                    amount: 50
                };

                const mockSwapQuoteResponse: IResponse<ISwapQuoteResponse> = {
                    success: true,
                    data: {
                        amountReceivable: '0.5',
                        networkFee: '0.01',
                        bridgeFee: '0.01',
                    }
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockSwapQuoteResponse
                });

                const result = await manager.getSwapQuote(swapQuoteData);
                expect(result).toEqual(mockSwapQuoteResponse);
            });
        })

        describe('getSupportedNetworks', () => {
            it('should fetch supported networks without blockchain info', async () => {
                const mockNetworks: SupportedNetworks[] = [
                    {
                        id: 'net_123',
                        name: 'Binance Smart Chain',
                        short_name: 'BSC',
                        isDisabled: false,
                        blockchain: {
                            id: 'bc_123',
                            name: 'BSC Blockchain',
                            created_at: '2024-01-01T00:00:00Z',
                            updated_at: '2024-01-01T00:00:00Z'
                        }
                    }
                ];

                const mockResponse: IResponse<SupportedNetworks[]> = {
                    success: true,
                    data: mockNetworks
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getSupportedNetworks(false);
                expect(result).toEqual(mockResponse);
                expect(mockedAxios.request).toHaveBeenCalledWith({
                    method: 'GET',
                    url: '/networks?includeBlockchain=false',
                    data: undefined
                });
            });

            it('should fetch supported networks with blockchain info', async () => {
                const mockNetworks: SupportedNetworks[] = [
                    {
                        id: 'net_123',
                        name: 'Ethereum',
                        short_name: 'ETH',
                        isDisabled: false,
                        blockchain: {
                            id: 'bc_456',
                            name: 'Ethereum Blockchain',
                            created_at: '2024-01-01T00:00:00Z',
                            updated_at: '2024-01-01T00:00:00Z'
                        }
                    }
                ];

                const mockResponse: IResponse<SupportedNetworks[]> = {
                    success: true,
                    data: mockNetworks
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getSupportedNetworks(true);
                expect(result).toEqual(mockResponse);
                expect(mockedAxios.request).toHaveBeenCalledWith({
                    method: 'GET',
                    url: '/networks?includeBlockchain=true',
                    data: undefined
                });
            });
        });

        describe('getWhitelistedAddress', () => {
            it('should fetch whitelisted addresses without network info', async () => {
                const mockWallets: WalletAccount[] = [
                    {
                        id: 'wallet_123',
                        networkId: 'bsc',
                        publicKey: '0x123...',
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z'
                    }
                ];

                const mockResponse: IResponse<WalletAccount[]> = {
                    success: true,
                    data: mockWallets
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getWhitelistedAddress(false);
                expect(result).toEqual(mockResponse);
                expect(mockedAxios.request).toHaveBeenCalledWith({
                    method: 'GET',
                    url: '/whitelisted?includeNetwork=false',
                    data: undefined
                });
            });

            it('should fetch whitelisted addresses with network info', async () => {
                const mockWallets: WalletAccount[] = [
                    {
                        id: 'wallet_123',
                        networkId: 'eth',
                        publicKey: '0x456...',
                        network: {
                            id: 'net_789',
                            name: 'Ethereum',
                            short_name: 'ETH'
                        },
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z'
                    }
                ];

                const mockResponse: IResponse<WalletAccount[]> = {
                    success: true,
                    data: mockWallets
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.getWhitelistedAddress(true);
                expect(result).toEqual(mockResponse);
                expect(mockedAxios.request).toHaveBeenCalledWith({
                    method: 'GET',
                    url: '/whitelisted?includeNetwork=true',
                    data: undefined
                });
            });
        });

        describe('whitelistAddress', () => {
            it('should whitelist address successfully', async () => {
                const whitelistData: WhiteListAddress = {
                    address: '0x789...',
                    networkId: 'bsc'
                };

                const mockWallets: WalletAccount[] = [
                    {
                        id: 'wallet_new',
                        networkId: 'bsc',
                        publicKey: '0x789...',
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z'
                    }
                ];

                const mockResponse: IResponse<WalletAccount[]> = {
                    success: true,
                    data: mockWallets
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.whitelistAddress(whitelistData);
                expect(result).toEqual(mockResponse);
            });
        });

        describe('updateBankAccount', () => {
            it('should update bank account successfully', async () => {
                const bankData: BankAccount = {
                    bankName: 'Test Bank',
                    bankAccountName: 'Test Account',
                    bankAccountNumber: '1234567890'
                };

                const mockResponse: IResponse<BankAccount> = {
                    success: true,
                    data: bankData
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.updateBankAccount(bankData);
                expect(result).toEqual(mockResponse);
                expect(mockedAxios.request).toHaveBeenCalledWith(
                    expect.objectContaining({
                        method: 'PUT',
                        url: '/bank-account'
                    })
                );
            });
        });

        describe('verifyBankAccount', () => {
            it('should verify bank account successfully', async () => {
                const verifyData: VerifyBankAccount = {
                    bankCode: '123',
                    accountNumber: '1234567890'
                };

                const mockVerifyResponse: VerifyBankAccountResponse = {
                    bank_name: 'Test Bank',
                    bank_code: '123',
                    account_number: '1234567890',
                    account_name: 'Test Account'
                };

                const mockResponse: IResponse<VerifyBankAccountResponse> = {
                    success: true,
                    data: mockVerifyResponse
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.verifyBankAccount(verifyData);
                expect(result).toEqual(mockResponse);
            });
        });

        describe('updateExternalAccounts (deprecated)', () => {
            it('should throw deprecation error', async () => {
                const updateData: UpdateExternalAccount = {};

                await expect(manager.updateExternalAccounts(updateData)).rejects.toThrow(
                    'Method is deprecated. Use whitelistAddress() to whitelist an address and updateBankAccount() to update bank account details.'
                );
            });

            it('should emit deprecation warning before throwing', async () => {
                const emitWarningSpy = jest.spyOn(process, 'emitWarning');
                const updateData: UpdateExternalAccount = {};

                try {
                    await manager.updateExternalAccounts(updateData);
                } catch (error) {
                    // Expected to throw
                }

                expect(emitWarningSpy).toHaveBeenCalledWith(
                    expect.stringContaining('[DEPRECATION] cNGNManager.updateExternalAccounts() is deprecated'),
                    expect.objectContaining({ code: 'CNGN_DEPRECATED_UPDATE_EXTERNAL_ACCOUNTS' })
                );

                emitWarningSpy.mockRestore();
            });
        });

        describe('Error Handling', () => {
            beforeEach(() => {
                jest.clearAllMocks();
            });

            it('should handle API errors properly', async () => {
                const errorMessage = 'API Error';
                const error = {
                    response: {
                        status: 400,
                        data: { message: errorMessage }
                    }
                };

                mockedAxios.request.mockRejectedValueOnce(error);

                await expect(manager.getBalance()).rejects.toThrow(
                    `API Error: 400 - ${errorMessage}`
                );
            });

            it('should handle network errors', async () => {
                const error = {
                    request: {},
                    response: undefined
                };

                mockedAxios.request.mockRejectedValueOnce(error);

                await expect(manager.getBalance()).rejects.toThrow(
                    'No response received from API'
                );
            });

            it('should handle request setup errors', async () => {
                const error = new Error('Network Error');

                mockedAxios.request.mockRejectedValueOnce(error);

                await expect(manager.getBalance()).rejects.toThrow(
                    'Error setting up request: Network Error'
                );
            });
        });
    });
});