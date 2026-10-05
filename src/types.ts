export type Amount = string | number;

export interface Balance {
  asset_type: string;
  asset_code: string;
  balance: Amount;
  [key: string]: unknown;
}

export interface Transaction {
  id?: string;
  from?: string;
  receiver?: { address?: string; bank?: string; accountNumber?: string } | string;
  amount?: Amount;
  description?: string;
  createdAt?: string;
  trx_ref?: string;
  trx_type?: string;
  network?: string;
  asset_type?: string;
  asset_symbol?: string;
  base_trx_hash?: string;
  extl_trx_hash?: string | null;
  explorer_link?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Pagination {
  count: number;
  pages: number;
  isLastPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface TransactionPage {
  data: Transaction[];
  pagination: Pagination;
}

export interface Network {
  id: string;
  name: string;
  short_name: string;
  isDisabled?: boolean;
  blockchain?: string | Record<string, unknown>;
  [key: string]: unknown;
}

export interface VirtualAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  [key: string]: unknown;
}

export interface TemporaryAccount extends VirtualAccount {
  reference?: string;
  paymentReference?: string;
  amount?: Amount;
  amountExpected?: Amount;
  fee?: Amount;
  vat?: Amount;
  currency?: string;
  status?: string;
  narration?: string;
  expiresAt?: string;
}

export interface Bank {
  name: string;
  code?: string;
  bankCode?: string;
  [key: string]: unknown;
}

export interface TransferResult {
  trxRef?: string;
  address?: string;
  [key: string]: unknown;
}

export interface AccountVerification {
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  [key: string]: unknown;
}

export interface BridgeQuote {
  amountReceivable?: Amount;
  networkFee?: Amount;
  bridgeFee?: Amount;
  [key: string]: unknown;
}

export interface BridgeResult {
  receivableAddress?: string;
  transactionId?: string;
  reference?: string;
  [key: string]: unknown;
}

export interface WhitelistEntry {
  id?: string;
  networkId?: string;
  publicKey?: string;
  internalPublicKey?: string;
  network?: Network | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface TemporaryAccountRequest {
  amount: number;
  customer: { email: string; name: string };
  accountName: string;
  narration?: string;
}

export interface RedeemRequest {
  amount: number;
  bankCode: string;
  accountNumber: string;
  saveDetails?: boolean;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
  networkId: string;
  shouldSaveAddress?: boolean;
}

export interface BridgeQuoteRequest {
  amount: number;
  originNetworkId: string;
  destinationNetworkId: string;
  destinationAddress: string;
}

export interface BridgeRequest {
  originNetworkId: string;
  destinationNetworkId: string;
  destinationAddress: string;
  senderAddress?: string;
  callbackUrl?: string;
}

export interface BankAccountRequest {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
}

export interface RequestOptions {
  idempotencyKey?: string;
  signal?: AbortSignal;
}
