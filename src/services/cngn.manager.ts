import axios, {AxiosInstance, AxiosResponse} from "axios";
import {
    Balance,
    ExternalAccounts,
    IResponse,
    IVirtualAccount,
    IWithdraw,
    RedeemAsset,
    Secrets,
    IWithdrawResponse,
    Transactions,
    IBanks,
    UpdateExternalAccount,
    Swap,
    SwapResponse,
    ITransactionPagination,
    ISwapQuote,
    ISwapQuoteResponse,
    WalletAccount,
    WhiteListAddress,
    BankAccount,
    VerifyBankAccount,
    VerifyBankAccountResponse,
    SupportedNetworks
} from "../utils/types";
import {AESCrypto} from "../utils/aes.standard";
import {Ed25519Crypto} from "../utils/Ed25519.standard";

const API_CURRENT_VERSION = 'v1';

export class cNGNManager {

    private readonly axiosInstance: AxiosInstance;

    constructor(private readonly secrets: Secrets ) {
        this.axiosInstance = axios.create({
            baseURL: `https://api.cngn.co/${API_CURRENT_VERSION}/api`,
            headers: {
                'Authorization': `Bearer ${this.secrets.apiKey}`,
                'Content-Type': 'application/json'
            },
        });

        this.axiosInstance.interceptors.response.use(
            response => response,
            error => this.handleApiError(error)
        );
    }

    private async handleApiError(error: any): Promise<never> {
        if (error.response) {
            throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
        }
        else if (error.request) {
            throw new Error('No response received from API');
        }
        else {
            throw new Error(`Error setting up request: ${error.message}`);
        }
    }

    private async makeCalls<T>(method: string, endpoint: string, data?: any): Promise<IResponse<T>> {
        try {
            const response: AxiosResponse<IResponse<T>> = await this.axiosInstance.request({
                method,
                url: endpoint,
                data: data ? AESCrypto.encrypt(JSON.stringify(data), this.secrets.encryptionKey) : undefined
            });
            if (typeof response.data.data === 'string') {
                const decryptedData = await Ed25519Crypto.decryptWithPrivateKey(this.secrets.privateKey, response.data.data);
                return {
                    ...response.data,
                    data: JSON.parse(decryptedData) as T
                };
            }

            return response.data as IResponse<T>;
        }
        catch (error) {
            throw await this.handleApiError(error);
        }
    }

    public async getBalance(): Promise<IResponse<Balance[]>> {
        return this.makeCalls('GET', '/balance');
    }

    public async getTransactionHistory(page: number = 1, limit: number = 10): Promise<IResponse<ITransactionPagination>> {
        return this.makeCalls('GET', `/transactions?page=${page}&limit=${limit}`);
    }

    public async withdraw(data: IWithdraw): Promise<IResponse<IWithdrawResponse>> {
        return this.makeCalls('POST', '/withdraw', data);
    }

    public async verifyWithdrawal(tnxRef: string): Promise<IResponse<Transactions>> {
        return this.makeCalls('GET', `/withdraw/verify/${tnxRef}`);
    }

    public async redeemAsset(data: RedeemAsset): Promise<IResponse<Transactions>> {
        return this.makeCalls('POST', '/redeemAsset', data);
    }

    public async getVirtualAccount(): Promise<IResponse<IVirtualAccount>> {
        return this.makeCalls('GET', '/virtual-account');
    }

    public async getBanks(): Promise<IResponse<IBanks[]>> {
        return this.makeCalls('GET', '/banks');
    }

    public async swapAsset(data: Swap): Promise<IResponse<SwapResponse>> {
        return this.makeCalls('POST', '/swap', data);
    }

    public async getSwapQuote(data: ISwapQuote): Promise<IResponse<ISwapQuoteResponse>> {
        return this.makeCalls('POST', '/swap-quote', data);
    }

    public async getSupportedNetworks(includeBlockchain?: boolean): Promise<IResponse<SupportedNetworks[]>> {
        return this.makeCalls('GET', '/networks?includeBlockchain=' + (includeBlockchain ? 'true' : 'false'));
    }

    public async getWhitelistedAddress(includeNetwork?: boolean): Promise<IResponse<WalletAccount[]>> {
        return this.makeCalls('GET', '/whitelisted?includeNetwork=' + (includeNetwork ? 'true' : 'false'));
    }

    public async whitelistAddress(data: WhiteListAddress): Promise<IResponse<WalletAccount[]>> {
        return this.makeCalls('POST', '/whitelist', data);
    }
    
    public async updateBankAccount(data: BankAccount): Promise<IResponse<BankAccount>> {
        return this.makeCalls('PUT', '/bank-account', data);
    }

    public async verifyBankAccount(data: VerifyBankAccount): Promise<IResponse<VerifyBankAccountResponse>> {
        return this.makeCalls('POST', '/account/verify', data);
    }

    /**
     * @deprecated This method is deprecated.
     * Use `whitelistAddress` to whitelist an address and `updateBankAccount` to update bank account details.
     */
    public async updateExternalAccounts(_: UpdateExternalAccount): Promise<IResponse<ExternalAccounts>> {
        const message =
            '[DEPRECATION] cNGNManager.updateExternalAccounts() is deprecated. ' +
            'Use whitelistAddress() to whitelist an address and updateBankAccount() to update bank account details.';

        if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') {
            process.emitWarning(message, { code: 'CNGN_DEPRECATED_UPDATE_EXTERNAL_ACCOUNTS' });
        } else if (typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn(message);
        }

        throw new Error('Method is deprecated. Use whitelistAddress() to whitelist an address and updateBankAccount() to update bank account details.')
    }

}