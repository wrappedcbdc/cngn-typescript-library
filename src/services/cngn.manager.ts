import axios, {AxiosInstance, AxiosResponse} from "axios";
import {
    Balance,
    ExternalAccounts,
    IResponse,
    IVirtualAccount,
    IWithdraw,
    RedeemAsset,
    CreateVirtualAccount,
    Secrets,
    Swap,
    Transactions,
    IBanks,
    UpdateExternalAccount
} from "../types";
import {AESCrypto} from "../utils/aes.standard";
import {Ed25519Crypto} from "../utils/Ed25519.standard";

const API_CURRENT_VERSION = 'v1';

export class cNGNManager {

    private readonly axiosInstance: AxiosInstance;

    constructor(private readonly secrets: Secrets ) {
        this.axiosInstance = axios.create({
            baseURL: `https://staging.api.wrapcbdc.com/${API_CURRENT_VERSION}/api`,
            headers: {
                'Authorization': `Bearer ${this.secrets.apiKey}`,
                'Content-Type': 'application/json'
            }
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

    public async getTransactionHistory(): Promise<IResponse<Transactions[]>> {
        return this.makeCalls('GET', '/transactions');
    }

    public async swapBetweenChains(data: Swap): Promise<IResponse<IWithdraw>> {
        return this.makeCalls('POST', '/swap', data);
    }

    public async redeemAsset(data: RedeemAsset): Promise<IResponse<Transactions>> {
        return this.makeCalls('POST', '/redeemAsset', data);
    }

    public async createVirtualAccount(data: CreateVirtualAccount): Promise<IResponse<IVirtualAccount>> {
        return this.makeCalls('POST', '/createVirtualAccount', data);
    }

    public async updateExternalAccounts(data: UpdateExternalAccount): Promise<IResponse<ExternalAccounts>> {
        return this.makeCalls('POST', '/updateBusiness', data);
    }

    public async getBanks(): Promise<IResponse<IBanks>> {
        return this.makeCalls('GET', '/banks');
    }

}