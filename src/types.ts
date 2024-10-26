export type Secrets =  {
    apiKey: string
    privateKey: string
    encryptionKey: string
}
export type IResponse<T> =  {
    success: boolean;
    data?: T;
    error?: string;
}

export type AESEncryptionResponse = {
    iv: string,
    content: string
}

export type Balance = {
    asset_type: string;
    asset_code: any;
    balance: string;
}

export type ProviderType = 'korapay' | 'budpay';

export enum TrxType {
    fiat_buy = 'fiat_buy',
    crypto_deposit = 'crypto_deposit',
    enaira_buy = 'enaira_buy',
    fiat_redeem = 'fiat_redeem',
    withdraw = 'withdraw',
    enaira_redeem = 'enaira_redeem',
    swap = 'swap'
}

export enum Network {
    bsc = 'bsc',
    atc = 'atc',
    xbn = 'xbn',
    eth = 'eth',
    matic = 'matic',
    trx = 'trx',
    base = 'base'
}

export enum AssetType {
    fiat = 'fiat',
    wrapped = 'wrapped',
    enaira = 'enaira'
}

export enum Status {
    pending = 'pending',
    pending_deposit = 'pending_deposit',
    failed = 'failed',
    rejected = 'rejected',
    completed = 'completed'
}

export interface Swap {
    shouldSaveAddress?: boolean;
    amount: number;
    address: string;
    network: Network;
}

export interface RedeemAsset {
    amount: number;
    bankCode: string;
    accountNumber: string;
    saveDetails?: boolean;
}

export interface CreateVirtualAccount {
    provider: ProviderType;
    bank_code?: string
}

export interface IVirtualAccount {
    accountReference: string;
    accountNumber: string;
}

export interface ExternalAccounts {
    xbn_address?: string | null;
    atc_address?: string | null;
    bsc_address?: string | null;
    eth_address?: string | null;
    base_address?: string | null;
    polygon_address?: string | null;
    tron_address?: string | null;
    bank_account_name?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
}

export interface IBanks {
    "name": string,
    "slug": string,
    "code": string,
    "country": string,
    "nibss_bank_code": string
}

export interface UpdateExternalAccount {
    walletAddress?: {
        bantuUserId?: string;
        xbnAddress?: string;
        bscAddress?: string;
        atcAddress?: string;
        polygonAddress?: string;
        ethAddress?: string;
        tronAddress?: string;
        baseAddress?: string;
    },
    bankDetails?: {
        bankName?: string;
        bankAccountName?: string;
        bankAccountNumber?: string;
    }
}

export interface IWithdraw {
    trxRef: string;
    address: string;
}

export interface Transactions {
    from: string;
    receiver: string;
    initiatorId: string;
    requires_multi_sig: boolean;
    total_sigs_required: number;
    amount: any;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    trx_ref: string;
    trx_type: TrxType;
    network: Network;
    asset_type: AssetType;
    asset_symbol?: string | null;
    status: Status;
    va_deposit_session_id?: string | null;
    va_payment_ref?: string | null;
    mpc_trx_ref?: string | null;
}

export interface GeneratedWalletAddress {
    mnemonic: string | null;
    address: string;
    network: Network;
    privateKey: string;
}
