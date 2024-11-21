import axios from 'axios';
import {
    Secrets,
    IResponse,
    Balance,
    Transactions,
    IWithdraw,
    RedeemAsset,
    IVirtualAccount,
    CreateVirtualAccount,
    ExternalAccounts,
    IBanks,
    Network,
    TrxType,
    AssetType,
    Status,
    ProviderType,
    UpdateExternalAccount,
    IWithdrawResponse,
    Swap,
    SwapResponse,
    ITransactionPagination
} from '../types';
import {cNGNManager} from "../services/cngn.manager";

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
                            network: Network.eth,
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
            it('should process swap successfully', async () => {
                const withdrawData: IWithdraw = {
                    amount: 1000,
                    address: '0x789...',
                    network: Network.bsc,
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

        describe('createVirtualAccount', () => {
            it('should create virtual account successfully', async () => {
                const mintData: CreateVirtualAccount = {
                    provider: 'korapay' as ProviderType,
                    bank_code: '123'
                };

                const mockVirtualAccount: IVirtualAccount = {
                    accountReference: 'REF123',
                    accountNumber: '1234567890'
                };

                const mockResponse: IResponse<IVirtualAccount> = {
                    success: true,
                    data: mockVirtualAccount
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.createVirtualAccount(mintData);
                expect(result).toEqual(mockResponse);
            });
        });

        describe('updateBusiness', () => {
            it('should update business details successfully', async () => {
                const updateData: UpdateExternalAccount = {
                    walletAddress: {
                        bscAddress: '0x123...',
                    },
                    bankDetails: {
                        bankName: 'Test Bank',
                        bankAccountName: 'Test Account',
                        bankAccountNumber: '1234567890'
                    }
                };

                const mockAccounts: ExternalAccounts = {
                    bsc_address: '0x123...',
                    bank_name: 'Test Bank',
                    bank_account_name: 'Test Account',
                    bank_account_number: '1234567890'
                };

                const mockResponse: IResponse<ExternalAccounts> = {
                    success: true,
                    data: mockAccounts
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.updateExternalAccounts(updateData);
                expect(result).toEqual(mockResponse);
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
                    network: Network.eth,
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
                    destinationNetwork: Network.bsc,
                    destinationAddress: '0x789...',
                    originNetwork: Network.bsc,
                    callbackUrl: 'https://test-callback.com'
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

        describe('Error Handling', () => {
            it('should handle API errors properly', async () => {
                const errorMessage = 'API Error';
                mockedAxios.request.mockRejectedValueOnce({
                    response: {
                        status: 400,
                        data: { message: errorMessage }
                    }
                });

                await expect(manager.getBalance()).rejects.toThrow(
                    `API Error: 400 - ${errorMessage}`
                );
            });

            it('should handle network errors', async () => {
                mockedAxios.request.mockRejectedValueOnce({
                    request: {}
                });

                await expect(manager.getBalance()).rejects.toThrow(
                    'No response received from API'
                );
            });

            it('should handle request setup errors', async () => {
                mockedAxios.request.mockRejectedValueOnce(new Error('Network Error'));

                await expect(manager.getBalance()).rejects.toThrow(
                    'Error setting up request: Network Error'
                );
            });
        });
    });
});