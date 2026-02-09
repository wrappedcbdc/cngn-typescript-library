# cNGN TypeScript Library - Nigerian Naira Stablecoin SDK

[![npm version](https://badge.fury.io/js/cngn-typescript-library.svg)](https://badge.fury.io/js/cngn-typescript-library)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://www.typescriptlang.org/)

**cngn-typescript-library** is the official TypeScript/JavaScript SDK for integrating with the **cNGN API** - Nigeria's leading digital naira stablecoin platform. This lightweight library provides developers with a comprehensive interface for blockchain payments, merchant account management, cross-chain swaps, and virtual account creation.

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start-guide)
- [Supported Networks](#-supported-blockchain-networks)
- [Core Features](#-core-features)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Security](#-security-features)
- [TypeScript Support](#-typescript-support)
- [Support](#-support--community)

## 📦 Installation

Install the cNGN TypeScript library via npm:

```bash
npm install cngn-typescript-library
```

Or using yarn:

```bash
yarn add cngn-typescript-library
```

## 🔧 Quick Start Guide

### Basic Setup

```typescript
import {
  cNGNManager,
  WalletManager,
  Secrets,
  Network
} from 'cngn-typescript-library';

// Configure your API credentials
const secrets: Secrets = {
    apiKey: 'your-api-key',
    privateKey: 'your-private-key',
    encryptionKey: 'your-encryption-key'
};

// Initialize the cNGN manager
const cngnManager = new cNGNManager(secrets);
```

### Check Account Balance

```typescript
// Get your cNGN balance
const balance = await cngnManager.getBalance();
console.log('Balance:', balance.data);
```

### Get Supported Networks

**Important:** Always call this first to get network UUIDs for API operations.

```typescript
// Get all supported networks
const networks = await cngnManager.getSupportedNetworks(false);

// Find a specific network
const bscNetwork = networks.data?.find(n => n.short_name === 'bsc');
console.log(`BSC Network ID: ${bscNetwork?.id}`);
// Output: BSC Network ID: 6c3b7ead-a82c-4edd-af75-81be1148482e
```

### Generate Crypto Wallet

```typescript
// Generate a new wallet using Network enum
const wallet = await WalletManager.generateWalletAddress(Network.bsc);
console.log('New BSC Wallet:', {
    address: wallet.address,
    privateKey: wallet.privateKey,
    network: wallet.network
});
```

## 🌐 Supported Blockchain Networks

The cNGN TypeScript library supports multiple blockchain networks. Network handling differs based on the operation:

### Network Enum (for Wallet Generation)
The `Network` enum is used for **wallet generation** with `WalletManager`:

| Network | Network Enum |
|---------|--------------|
| Binance Smart Chain | `Network.bsc` |
| Ethereum | `Network.eth` |
| Polygon (Matic) | `Network.matic` |
| Tron | `Network.trx` |
| Base | `Network.base` |
| Solana | `Network.sol` |
| Asset Chain | `Network.atc` |
| Bantu Chain | `Network.xbn` |
| Lisk | `Network.lisk` |
| Monad | `Network.monad` |
| Circle Arc chain | `Network.arc` |

### Network IDs (for API Operations)
For API operations (withdrawals, swaps, whitelisting), you need to use **network UUIDs** obtained from the `getSupportedNetworks()` method:

```typescript
// Get supported networks with their IDs
const networks = await cngnManager.getSupportedNetworks(true);

// Example response
networks.data?.forEach(network => {
    console.log(`${network.name}: ${network.id}`);
    // Output: "Binance Smart Chain: 6c3b7ead-a82c-4edd-af75-81be1148482e"
});
```

**Important:**
- Use `Network` enum for `WalletManager.generateWalletAddress()`
- Use network UUID strings (from `getSupportedNetworks()`) for `networkId` parameters in API calls

## 🎯 Core Features

### 💰 Account Management
- Check cNGN balance and transaction history
- Real-time balance updates
- Multi-currency support

### 🏦 Banking Integration
- Create virtual bank accounts 
- Instant naira-to-cNGN conversion

### 🔄 Cross-Chain Operations
- Swap cNGN between different blockchains
- Bridge assets across networks
- Real-time swap quotes and fees

### 💸 Withdrawals & Redemptions
- Withdraw cNGN to any supported blockchain
- Redeem cNGN back to Nigerian bank accounts
- Verify withdrawal status and references

### 👛 Wallet Management
- Generate HD wallets for any network
- Multi-signature wallet support
- Secure private key management

## 📚 API Reference

### Complete Workflow Example

```typescript
import { cNGNManager, Secrets } from 'cngn-typescript-library';

const secrets: Secrets = {
    apiKey: process.env.CNGN_API_KEY!,
    privateKey: process.env.CNGN_PRIVATE_KEY!,
    encryptionKey: process.env.CNGN_ENCRYPTION_KEY!
};

const cngnManager = new cNGNManager(secrets);

async function completeWorkflow() {
    // 1. Get supported networks (always do this first to get network IDs)
    const networks = await cngnManager.getSupportedNetworks(true);
    const bscNetwork = networks.data?.find(n => n.short_name === 'bsc');
    const baseNetwork = networks.data?.find(n => n.short_name === 'base');

    // 2. Check balance
    const balance = await cngnManager.getBalance();
    console.log('Current Balance:', balance.data);

    // 3. Withdraw to blockchain
    const withdrawal = await cngnManager.withdraw({
        amount: 1600,
        address: '0x1767A569Fa8d72527b7a5792F431bF75045AdFc9',
        networkId: bscNetwork!.id,
        shouldSaveAddress: false
    });

    // 4. Verify withdrawal
    const verification = await cngnManager.verifyWithdrawal(withdrawal.data!.trxRef);

    // 5. Cross-chain swap
    const swap = await cngnManager.swapAsset({
        originNetworkId: bscNetwork!.id,
        destinationNetworkId: baseNetwork!.id,
        destinationAddress: '0xfaEcCB96f7C6985E64cfB055221dc512D9fD0845'
    });

    // 6. Redeem to bank account
    const redemption = await cngnManager.redeemAsset({
        amount: 1000000,
        bankCode: '011',
        accountNumber: '3069839406'
    });
}
```

### cNGNManager Methods

#### Account Operations

```typescript
// Get account balance
const balance = await cngnManager.getBalance();
console.log('Balance:', balance.data);

// Get transaction history with pagination
const transactions = await cngnManager.getTransactionHistory(1, 20);

console.log('Transactions:', {
    data: transactions.data?.data, // Array of transactions
    pagination: transactions.data?.pagination // Pagination info
});

// Get supported Nigerian banks
const banks = await cngnManager.getBanks();
console.log('Banks:', banks.data?.map(bank => ({
    name: bank.name,
    code: bank.code
})));
```

#### Withdrawal Operations

```typescript
import { IWithdraw } from 'cngn-typescript-library';

// Step 1: Get supported networks to find the network ID
const networks = await cngnManager.getSupportedNetworks(false);
const bscNetwork = networks.data?.find(n => n.short_name === 'bsc');

// Step 2: Withdraw cNGN to blockchain address using network UUID
const withdrawData: IWithdraw = {
    amount: 1600, // Amount in kobo (16 NGN)
    address: '0x1767A569Fa8d72527b7a5792F431bF75045AdFc9',
    networkId: bscNetwork?.id || '6c3b7ead-a82c-4edd-af75-81be1148482e', // Network UUID from API
    shouldSaveAddress: false
};

const withdrawResult = await cngnManager.withdraw(withdrawData);
console.log('Transaction Reference:', withdrawResult.data?.trxRef);

// Verify withdrawal status
const verification = await cngnManager.verifyWithdrawal(withdrawResult.data?.trxRef || 'TNX-REF-12345');
console.log('Withdrawal Status:', verification.data?.status);
```

#### Bank Redemption

```typescript
import { RedeemAsset } from 'cngn-typescript-library';

// Redeem cNGN to Nigerian bank account
const redeemData: RedeemAsset = {
    amount: 1000000, // Amount in kobo (10,000 NGN)
    bankCode: '011', // First Bank code
    accountNumber: '3069839406',
    saveDetails: true // Save bank details for future use
};

const redemption = await cngnManager.redeemAsset(redeemData);

console.log('Redemption Result:', {
    transactionRef: redemption.data?.trx_ref,
    status: redemption.data?.status,
    amount: redemption.data?.amount
});
```

#### Virtual Account Management

```typescript
import { IVirtualAccount } from 'cngn-typescript-library';

// Get existing virtual account details
const virtualAccount = await cngnManager.getVirtualAccount();

console.log('Virtual Account Details:', {
    accountNumber: virtualAccount.data?.accountNumber,
    accountName: virtualAccount.data?.accountName,
    bankName: virtualAccount.data?.bankName,
    bankCode: virtualAccount.data?.bankCode
});

// Use this virtual account to receive Nigerian Naira
// Funds sent to this account are automatically converted to cNGN
```

#### Cross-Chain Swaps

```typescript
import { Swap, ISwapQuote } from 'cngn-typescript-library';

// Step 1: Get supported networks
const networks = await cngnManager.getSupportedNetworks(false);
const bscNetwork = networks.data?.find(n => n.short_name === 'bsc');
const baseNetwork = networks.data?.find(n => n.short_name === 'base');

// Step 2: Get swap quote
const quoteData: ISwapQuote = {
    originNetworkId: bscNetwork?.id || '6c3b7ead-a82c-4edd-af75-81be1148482e', // BSC
    destinationNetworkId: baseNetwork?.id || '03cae1ad-b62c-41c9-bb9e-2f6321eb947e', // Base
    amount: 1000, // Amount in kobo
    destinationAddress: '0xfaEcCB96f7C6985E64cfB055221dc512D9fD0845'
};

const quote = await cngnManager.getSwapQuote(quoteData);

console.log('Swap Quote:', {
    amountReceivable: quote.data?.amountReceivable,
    networkFee: quote.data?.networkFee,
    bridgeFee: quote.data?.bridgeFee
});

// Step 3: Execute swap
const swapData: Swap = {
    originNetworkId: bscNetwork?.id || '6c3b7ead-a82c-4edd-af75-81be1148482e',
    destinationNetworkId: baseNetwork?.id || '03cae1ad-b62c-41c9-bb9e-2f6321eb947e',
    destinationAddress: '0xfaEcCB96f7C6985E64cfB055221dc512D9fD0845',
    callbackUrl: 'https://yourapp.com/callback', // Optional
    senderAddress: '0x1767A569Fa8d72527b7a5792F431bF75045AdFc9' // Optional
};

const swapResult = await cngnManager.swapAsset(swapData);
console.log('Swap Response:', {
    receivableAddress: swapResult.data?.receivableAddress,
    transactionId: swapResult.data?.transactionId,
    reference: swapResult.data?.reference
});
```

#### Network Management

```typescript
import { SupportedNetworks } from 'cngn-typescript-library';

// Get all supported networks (without blockchain details)
const networks = await cngnManager.getSupportedNetworks(false);

console.log('Supported Networks:');
networks.data?.forEach(network => {
    console.log({
        id: network.id, // UUID to use for networkId in API calls
        name: network.name,
        shortName: network.short_name,
        isDisabled: network.isDisabled
    });
});

// Get supported networks with blockchain details
const networksWithBlockchain = await cngnManager.getSupportedNetworks(true);

console.log('Networks with Blockchain Info:');
networksWithBlockchain.data?.forEach(network => {
    console.log({
        id: network.id,
        name: network.name,
        blockchain: network.blockchain.name
    });
});
```

#### Address Whitelisting

```typescript
import { WhiteListAddress, WalletAccount } from 'cngn-typescript-library';

// Step 1: Get network ID from supported networks
const networks = await cngnManager.getSupportedNetworks(false);
const bscNetwork = networks.data?.find(n => n.short_name === 'bsc');

// Step 2: Whitelist a new address
const whitelistData: WhiteListAddress = {
    address: '0x2DeD9c59cB12bF503dCf089BE13380296590b706',
    networkId: bscNetwork?.id || '9840303d-452b-4e9a-9646-e1141103bf9a' // Network UUID
};

const whitelistResult = await cngnManager.whitelistAddress(whitelistData);
console.log('Whitelisted:', whitelistResult.data);

// Get all whitelisted addresses (without network details)
const whitelistedAddresses = await cngnManager.getWhitelistedAddress(false);

console.log('Whitelisted Addresses:', whitelistedAddresses.data?.map(w => ({
    id: w.id,
    publicKey: w.publicKey,
    networkId: w.networkId
})));

// Get whitelisted addresses with full network information
const whitelistedWithNetwork = await cngnManager.getWhitelistedAddress(true);

console.log('Whitelisted with Network Info:', whitelistedWithNetwork.data?.map(w => ({
    id: w.id,
    publicKey: w.publicKey,
    network: w.network // Full network object included
})));
```

#### Bank Account Management

```typescript
import { BankAccount, VerifyBankAccount } from 'cngn-typescript-library';

// Step 1: Get list of supported banks
const banks = await cngnManager.getBanks();

console.log('Available Banks:', banks.data?.map(bank => ({
    name: bank.name,
    code: bank.code,
    country: bank.country
})));

// Step 2: Verify bank account details before transactions
const verifyData: VerifyBankAccount = {
    bankCode: '011', // First Bank code
    accountNumber: '3069839406'
};

const verification = await cngnManager.verifyBankAccount(verifyData);

console.log('Account Details:', {
    bankName: verification.data?.bank_name,
    accountName: verification.data?.account_name,
    bankCode: verification.data?.bank_code,
    accountNumber: verification.data?.account_number
});

// Step 3: Update/save bank account information
const bankData: BankAccount = {
    bankName: 'First Bank of Nigeria',
    bankAccountName: 'EZUMAH JEREMIAH KALU',
    bankAccountNumber: '3069839406'
};

const updateResult = await cngnManager.updateBankAccount(bankData);
console.log('Bank Account Updated:', updateResult.data);
```

### WalletManager Methods

The `WalletManager` is used for generating cryptocurrency wallets. It uses the `Network` enum (not network UUIDs).

```typescript
import { WalletManager, Network } from 'cngn-typescript-library';

// Generate new wallets using Network enum
const bscWallet = await WalletManager.generateWalletAddress(Network.bsc);
const ethWallet = await WalletManager.generateWalletAddress(Network.eth);
const polygonWallet = await WalletManager.generateWalletAddress(Network.matic);
const solanaWallet = await WalletManager.generateWalletAddress(Network.sol);
const tronWallet = await WalletManager.generateWalletAddress(Network.trx);

console.log('Generated BSC Wallet:', {
    address: bscWallet.address,
    privateKey: bscWallet.privateKey,
    mnemonic: bscWallet.mnemonic,
    network: bscWallet.network // Returns 'bsc'
});

// Alternative: Use string short name directly
const baseWallet = await WalletManager.generateWalletAddress('base');

// ⚠️ Important: These wallets are generated locally
// They are NOT automatically registered with the cNGN API
// Use whitelistAddress() to register them for withdrawals
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The library maintains >90% test coverage across:
- API endpoint integration
- Wallet generation functionality
- Error handling scenarios
- Network compatibility
- TypeScript type validation

### Example Usage

Check out `src/endpoints.ts` for comprehensive usage examples of all API methods with real network UUIDs and proper parameter formats.

## 🔒 Security Features

### Encryption & Cryptography
- **AES Encryption** for all API requests
- **Ed25519 Decryption** for secure response handling
- **BIP39 Mnemonic** generation for wallet creation
- **HD Wallet** derivation paths

### Best Practices
- Never log sensitive credentials
- Use environment variables for API keys
- Implement proper error handling
- Validate all user inputs

```typescript
// Secure credential management
const secrets: Secrets = {
    apiKey: process.env.CNGN_API_KEY!,
    privateKey: process.env.CNGN_PRIVATE_KEY!,
    encryptionKey: process.env.CNGN_ENCRYPTION_KEY!
};

// Proper error handling
try {
    const result = await manager.getBalance();
} catch (error) {
    if (error.response?.status === 401) {
        console.error('Invalid API credentials');
    } else if (error.response?.status === 429) {
        console.error('Rate limit exceeded');
    } else {
        console.error('Operation failed:', error.message);
    }
}
```

## 📝 TypeScript Support

Full TypeScript definitions included:

```typescript
// All interfaces and types are fully typed
interface Balance {
    asset_type: string;
    asset_code: any;
    balance: string;
}

interface GeneratedWalletAddress {
    mnemonic: string | null;
    address: string;
    network: string;
    privateKey: string;
}

interface IResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Network enum for type-safe network selection
enum Network {
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
    sol = 'sol'
}
```

### Available Types

#### Enums
- `Network` - **For wallet generation only** (bsc, eth, matic, trx, base, sol, atc, xbn, lisk, monad, arc)
  ```typescript
  // ✅ Correct usage
  const wallet = await WalletManager.generateWalletAddress(Network.bsc);

  // ❌ Don't use for API operations
  // const withdrawal = await cngnManager.withdraw({ networkId: Network.bsc }); // WRONG!
  ```
- `TrxType` - Transaction types (fiat_buy, crypto_deposit, enaira_buy, fiat_redeem, withdraw, enaira_redeem, swap)
- `AssetType` - Asset types (fiat, wrapped, enaira)
- `Status` - Transaction status (pending, pending_deposit, failed, rejected, completed)

#### Important: Network Enum vs Network ID
- **`Network` enum** = Used for `WalletManager.generateWalletAddress()`
  - Values: `Network.bsc`, `Network.eth`, etc.
- **`networkId` (UUID string)** = Used for all API operations (withdraw, swap, whitelist)
  - Values: `'6c3b7ead-a82c-4edd-af75-81be1148482e'`, obtained from `getSupportedNetworks()`

#### Core Types
- `Secrets` - API credentials configuration
- `IResponse<T>` - Standard API response wrapper
- `Balance` - Account balance information
- `Transactions` - Transaction history details
- `ITransactionPagination` - Paginated transaction history

#### Transaction Types
- `IWithdraw` - Withdrawal parameters
  ```typescript
  interface IWithdraw {
      shouldSaveAddress?: boolean;
      amount: number;
      address: string;
      networkId: string; // UUID from getSupportedNetworks()
  }
  ```
- `IWithdrawResponse` - Withdrawal response with transaction reference
- `RedeemAsset` - Bank redemption data

#### Virtual Account & Banking
- `IVirtualAccount` - Virtual account details
- `BankAccount` - Bank account information
- `VerifyBankAccount` - Bank account verification parameters
- `VerifyBankAccountResponse` - Bank account verification result
- `IBanks` - Supported banks list

#### Swap & Cross-Chain
- `Swap` - Cross-chain swap parameters
  ```typescript
  interface Swap {
      destinationNetworkId: string; // UUID from getSupportedNetworks()
      destinationAddress: string;
      originNetworkId: string; // UUID from getSupportedNetworks()
      callbackUrl?: string;
      senderAddress?: string;
  }
  ```
- `SwapResponse` - Swap transaction response
- `ISwapQuote` - Swap quote parameters
  ```typescript
  interface ISwapQuote {
      amount: number;
      destinationAddress: string;
      originNetworkId: string; // UUID from getSupportedNetworks()
      destinationNetworkId: string; // UUID from getSupportedNetworks()
  }
  ```
- `ISwapQuoteResponse` - Swap quote with fees

#### Network & Address Management
- `SupportedNetworks` - List of supported blockchain networks
- `WalletAccount` - Whitelisted wallet account
- `WhiteListAddress` - Address whitelisting parameters

#### Wallet Generation
- `GeneratedWalletAddress` - Wallet generation response

#### Deprecated
- `UpdateExternalAccount` - ⚠️ **Deprecated**: Use `whitelistAddress()` and `updateBankAccount()` instead

## 🚀 Production Usage

### Environment Configuration

```bash
# .env file
CNGN_API_KEY=your_production_api_key
CNGN_PRIVATE_KEY=your_production_private_key
CNGN_ENCRYPTION_KEY=your_production_encryption_key
```

### Development Setup

```bash
git clone https://github.com/your-username/cngn-typescript-library.git
cd cngn-typescript-library
npm install
npm run build
npm test
```

## 📞 Support & Community

- **GitHub Issues**: [Report bugs and request features](https://github.com/wrappedcbdc/cngn-typescript-library/issues)
- **Documentation**: [Full API documentation](https://github.com/wrappedcbdc/cngn-typescript-library/wiki)
- **Email Support**: support@withconvexity.com
- **Website**: [https://cngn.co](https://cngn.co)

### Getting Help

1. Check the [documentation](https://github.com/wrappedcbdc/cngn-typescript-library/wiki)
2. Search [existing issues](https://github.com/wrappedcbdc/cngn-typescript-library/issues)
3. Create a [new issue](https://github.com/wrappedcbdc/cngn-typescript-library/issues/new) with detailed information

## 📄 License

This project is licensed under the [ISC License](https://choosealicense.com/licenses/isc/).

---

## 🏷️ Keywords

`cNGN`, `Nigerian Naira`, `Stablecoin`, `TypeScript`, `JavaScript`, `Blockchain`, `Crypto`, `Fintech`, `Nigeria`, `Digital Payments`, `API SDK`, `Ethereum`, `Binance Smart Chain`, `Polygon`, `Tron`, `Cross-chain`, `Virtual Accounts`, `Banking Integration`, `Merchant API`, `CBDC`

**Made with ❤️ by [Convexity](https://withconvexity.com) for the Nigerian fintech ecosystem**