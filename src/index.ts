import axios, {AxiosInstance, AxiosResponse} from "axios";
import {AESCrypto} from "./utils/aes.standard";
import {Ed25519Crypto} from "./utils/Ed25519.standard";
import {
    Balance,
    DepositParams,
    ExternalAccounts,
    IResponse,
    IVirtualAccount,
    IWithdraw,
    MintParams,
    Secrets,
    SwapParams,
    Transactions,
    WhiteListAddressParams,
} from "./types";

const API_CURRENT_VERSION = 'v1';

export class CNGnManager {

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

    public async swapBetweenChains(data: SwapParams): Promise<IResponse<IWithdraw>> {
        return this.makeCalls('POST', '/swap', data);
    }

    public async depositForRedemption(data: DepositParams): Promise<IResponse<Transactions>> {
        return this.makeCalls('POST', '/deposit', data);
    }

    public async createVirtualAccount(data: MintParams): Promise<IResponse<IVirtualAccount>> {
        return this.makeCalls('POST', '/createVirtualAccount', data);
    }

    public async whitelistAddress(data: WhiteListAddressParams): Promise<IResponse<ExternalAccounts>> {
        return this.makeCalls('POST', '/whiteListAddress', data);
    }

}
