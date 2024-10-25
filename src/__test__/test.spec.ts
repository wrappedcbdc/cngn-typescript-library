import axios from 'axios';
import {
    Secrets,
    IResponse,
    Balance,
    Transactions,
    IWithdraw,
    Swap,
    RedeemAsset,
    IVirtualAccount,
    CreateVirtualAccount,
    ExternalAccounts,
    UpdateBusiness,
    IBanks,
    Network,
    TrxType,
    AssetType,
    Status,
    ProviderType
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
                baseURL: 'https://staging.api.wrapcbdc.com/v1/api',
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
                const mockTransactions: Transactions[] = [{
                    from: '0x123...',
                    receiver: '0x456...',
                    initiatorId: 'init123',
                    requires_multi_sig: false,
                    total_sigs_required: 1,
                    amount: '1000',
                    description: 'Test transaction',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    trx_ref: 'TRX123',
                    trx_type: TrxType.fiat_buy,
                    network: Network.bsc,
                    asset_type: AssetType.fiat,
                    asset_symbol: 'cNGN',
                    status: Status.completed,
                    va_deposit_session_id: null,
                    va_payment_ref: null,
                    mpc_trx_ref: null
                }];

                const mockResponse: IResponse<Transactions[]> = {
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

        describe('swapBetweenChains', () => {
            it('should process swap successfully', async () => {
                const swapData: Swap = {
                    amount: 1000,
                    address: '0x789...',
                    network: Network.bsc,
                    shouldSaveAddress: true
                };

                const mockWithdraw: IWithdraw = {
                    trxRef: 'TRX123',
                    address: '0x789...'
                };

                const mockResponse: IResponse<IWithdraw> = {
                    success: true,
                    data: mockWithdraw
                };

                mockedAxios.request.mockResolvedValueOnce({
                    data: mockResponse
                });

                const result = await manager.swapBetweenChains(swapData);
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
                const updateData: UpdateBusiness = {
                    walletAddress: {
                        bscAddress: '0x123...',
                        xbnAddress: null,
                        atcAddress: null,
                        polygonAddress: null,
                        ethAddress: null,
                        tronAddress: null,
                        baseAddress: null
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

                const result = await manager.updateBusiness(updateData);
                expect(result).toEqual(mockResponse);
            });
        });

        describe('getBanks', () => {
            it('should fetch banks successfully', async () => {
                const mockBanks: IBanks = {
                    name: 'Test Bank',
                    slug: 'test-bank',
                    code: '123',
                    country: 'NG',
                    nibss_bank_code: '123456'
                };

                const mockResponse: IResponse<IBanks> = {
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
                    from: '0x123...',
                    receiver: '1234567890',
                    initiatorId: 'init123',
                    requires_multi_sig: false,
                    total_sigs_required: 1,
                    amount: '1000',
                    description: 'Asset redemption',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    trx_ref: 'TRX123',
                    trx_type: TrxType.fiat_redeem,
                    network: Network.bsc,
                    asset_type: AssetType.fiat,
                    status: Status.pending,
                    va_deposit_session_id: null,
                    va_payment_ref: null,
                    mpc_trx_ref: null
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