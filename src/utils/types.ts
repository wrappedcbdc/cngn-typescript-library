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

/** @deprecated Use of 'budpay' and 'bellbank' is deprecated. */

export enum TrxType {
    fiat_buy = 'fiat_buy',
    crypto_deposit = 'crypto_deposit',
    enaira_buy = 'enaira_buy',
    fiat_redeem = 'fiat_redeem',
    withdraw = 'withdraw',
    enaira_redeem = 'enaira_redeem',
    swap = 'swap'
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

export interface IWithdraw {
    shouldSaveAddress?: boolean;
    amount: number;
    address: string;
    networkId: string;
}


export enum Network {
    bsc = 'bsc',
    atc = 'atc',
    xbn = 'xbn',
    eth = 'eth',
    matic = 'matic',
    trx = 'trx',
    base = 'base',
    lisk = 'lisk',
    monad = 'monad',
    arc = 'arc',
}

export interface RedeemAsset {
    amount: number;
    bankCode: string;
    accountNumber: string;
    saveDetails?: boolean;
}

export interface IVirtualAccount {
    accountNumber: string,
    accountName: string,
    bankCode: string,
    bankName: string
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

export interface UpdateExternalAccount {}

export interface IWithdrawResponse {
    trxRef: string;
    address: string;
}

export interface IPagination {
    count: number,
    pages: number,
    isLastPage: boolean,
    nextPage: number | null,
    previousPage: number | null,
}

export interface ITransactionPagination {
    data: Transactions[]
    pagination: IPagination
}

export interface Transactions {
    id: string;
    from: string;
    receiver: Receiver;
    amount: string;
    description: string;
    createdAt: string;
    trx_ref: string;
    trx_type: string;
    network: string;
    asset_type: string;
    asset_symbol: string;
    base_trx_hash: string;
    extl_trx_hash: string;
    explorer_link: string;
    status: string;
}

interface Receiver {
    address?: string;
    bank?: string;
    accountNumber?: string;
}

export interface GeneratedWalletAddress {
    mnemonic: string | null;
    address: string;
    network: string;
    privateKey: string;
}

export interface Swap {
    destinationNetworkId: string;
    destinationAddress: string;
    originNetworkId: string;
    callbackUrl?: string;
    senderAddress?: string
}

export interface SwapResponse {
    receivableAddress: string;
    transactionId: string;
    reference: string;
}

export interface ISwapQuote {
    amount: number;
    destinationAddress: string;
    originNetworkId: string;
    destinationNetworkId: string;
}

export interface ISwapQuoteResponse {
    amountReceivable: string;
    networkFee: string;
    bridgeFee: string;
}

interface Networks {
    id: string;
    name: string;
    short_name: string;
}

export interface WalletAccount {
    id: string;
    networkId: string;
    publicKey: string;
    network?: Networks;
    created_at: string;
    updated_at: string;
}

export interface WhiteListAddress {
    address: string;
    networkId: string;
}

export interface BankAccount {
    bankName: string,
    bankAccountName: string,
    bankAccountNumber: string
}

export interface VerifyBankAccount {
    bankCode: string,
    accountNumber: string
}

export interface VerifyBankAccountResponse {
    bank_name: string,
    bank_code: string,
    account_number: string,
    account_name: string
}

export interface SupportedNetworks {
    id: string,
    name: string,
    short_name: string,
    isDisabled: boolean,
    blockchain: {
        id: string,
        name: string,
        created_at: string,
        updated_at: string
    }
}