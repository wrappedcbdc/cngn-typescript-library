# cNGN TypeScript Library - Nigerian Naira Stablecoin SDK

[![npm version](https://badge.fury.io/js/cngn-typescript-library.svg)](https://badge.fury.io/js/cngn-typescript-library)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue.svg)](https://www.typescriptlang.org/)

**cngn-typescript-library** is the official TypeScript/JavaScript SDK for integrating with the **cNGN API** - Nigeria's leading digital naira stablecoin platform. This lightweight library provides developers with a comprehensive interface for blockchain payments, merchant account management, cross-chain swaps, and virtual account creation.

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
console.log(`Current balance: ${balance.amount} cNGN`);
```

### Generate Crypto Wallet

```typescript
// Generate a new wallet address for any supported network
const wallet = await WalletManager.generateWalletAddress(Network.bsc);
console.log(`New BSC address: ${wallet.address}`);
```

## 🌐 Supported Blockchain Networks

The cNGN TypeScript library supports all major blockchain networks:

| Network | Code | Description |
|---------|------|-------------|
| Binance Smart Chain | `Network.bsc` | Low-cost, fast transactions |
| Ethereum | `Network.eth` | Most secure, highest liquidity |
| Polygon (Matic) | `Network.matic` | Ethereum-compatible, low fees |
| Tron | `Network.trx` | High throughput blockchain |
| Base | `Network.base` | Coinbase's L2 solution |
| Asset Chain | `Network.atc` | African-focused blockchain |
| Bantu Chain | `Network.xbn` | African blockchain network |

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start-guide)
- [Supported Networks](#-supported-blockchain-networks)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Security](#-security)
- [TypeScript Support](#-typescript-support)
- [Contributing](#-contributing)
- [Support](#-support)

## 🎯 Core Features

### 💰 Account Management
- Check cNGN balance and transaction history
- Real-time balance updates
- Multi-currency support

### 🏦 Banking Integration
- Create virtual bank accounts (Korapay)
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

### cNGNManager Methods

#### Account Operations

```typescript
// Get account balance
const balance = await cngnManager.getBalance();

// Get transaction history with pagination
const transactions = await cngnManager.getTransactionHistory(1, 20);

// Get supported Nigerian banks
const banks = await cngnManager.getBanks();
```

#### Withdrawal Operations

```typescript
import { IWithdraw, Network } from 'cngn-typescript-library';

// Withdraw cNGN to blockchain address
const withdrawData: IWithdraw = {
    amount: 50000, // Amount in kobo (500 NGN)
    address: '0x742d35Cc6634C0532925a3b8D400612d3a5B0d21',
    network: Network.bsc,
    shouldSaveAddress: true
};

const withdrawResult = await cngnManager.withdraw(withdrawData);

// Verify withdrawal status
const verification = await cngnManager.verifyWithdrawal('TNX-REF-12345');
```

#### Bank Redemption

```typescript
import { RedeemAsset } from 'cngn-typescript-library';

// Redeem cNGN to Nigerian bank account
const redeemData: RedeemAsset = {
    amount: 100000, // Amount in kobo (1,000 NGN)
    bankCode: '058', // GTBank code
    accountNumber: '0123456789',
    saveDetails: true
};

const redemption = await cngnManager.redeemAsset(redeemData);
```

#### Virtual Account Creation

```typescript
import { CreateVirtualAccount } from 'cngn-typescript-library';

// Create virtual account for receiving naira
const virtualAccountData: CreateVirtualAccount = {
    provider: 'korapay', // or 'flutterwave'
    bank_code: '058' // GTBank
};

const virtualAccount = await cngnManager.createVirtualAccount(virtualAccountData);
```

#### Cross-Chain Swaps

```typescript
import { Swap, ISwapQuote } from 'cngn-typescript-library';

// Get swap quote
const quoteData: ISwapQuote = {
    destinationNetwork: Network.eth,
    destinationAddress: '0x742d35Cc6634C0532925a3b8D400612d3a5B0d21',
    originNetwork: Network.bsc,
    amount: 50000
};

const quote = await cngnManager.getSwapQuote(quoteData);

// Execute swap
const swapData: Swap = {
    destinationNetwork: Network.eth,
    destinationAddress: '0x742d35Cc6634C0532925a3b8D400612d3a5B0d21',
    originNetwork: Network.bsc,
    callbackUrl: 'https://yourapp.com/callback' // Optional
};

const swapResult = await cngnManager.swapAsset(swapData);
```

### WalletManager Methods

```typescript
import { WalletManager, Network } from 'cngn-typescript-library';

// Generate new wallet for any network
const bscWallet = await WalletManager.generateWalletAddress(Network.bsc);
const ethWallet = await WalletManager.generateWalletAddress(Network.eth);
const polygonWallet = await WalletManager.generateWalletAddress(Network.matic);

console.log('BSC Wallet:', {
    address: bscWallet.address,
    privateKey: bscWallet.privateKey,
    mnemonic: bscWallet.mnemonic
});
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
    network: Network;
    privateKey: string;
}

interface IResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
}
```

### Available Types

- `Secrets` - API credentials configuration
- `IResponse<T>` - Standard API response wrapper
- `Balance` - Account balance information
- `Transactions` - Transaction history details
- `IWithdraw` - Withdrawal parameters
- `RedeemAsset` - Bank redemption data
- `CreateVirtualAccount` - Virtual account creation
- `UpdateExternalAccount` - Business account updates
- `Swap` - Cross-chain swap parameters
- `GeneratedWalletAddress` - Wallet generation response

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