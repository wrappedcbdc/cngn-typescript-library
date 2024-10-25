# cngn-typescript-library

cngn-typescript-library is a TypeScript library for interacting with the cNGN API. It provides a simple interface for various operations such as checking balance, swapping between chains, depositing for redemption, creating virtual accounts, generating wallet addresses, and more.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Networks](#networks)
- [Available Methods](#available-methods)
    - [cNGNManager Methods](#cngnmanager-methods)
    - [WalletManager Methods](#walletmanager-methods)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Types](#types)
- [Security](#security)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation

To install cngn-typescript-library and its dependencies, run:

```bash
npm install cngn-typescript-library
```

## Usage

First, import the necessary classes and types:

```typescript
import {
    cNGNManager,
    WalletManager,
    Secrets,
    Swap,
    RedeemAsset,
    Mint,
    UpdateBusiness,
    Network
} from 'cngn-typescript-library';
```

Then, create an instance of `cNGNManager` with your secrets:

```typescript
const secrets: Secrets = {
    apiKey: 'your-api-key',
    privateKey: 'your-private-key',
    encryptionKey: 'your-encryption-key'
};

const manager = new cNGNManager(secrets);

// Example: Get balance
manager.getBalance().then(balance => console.log(balance));
```

## Networks

The library supports multiple blockchain networks:

- `Network.bsc` - Binance Smart Chain
- `Network.atc` - Asset Chain
- `Network.xbn` - Bantu Chain
- `Network.eth` - Ethereum
- `Network.matic` - Polygon (Matic)
- `Network.trx` - Tron
- `Network.base` - Base

## Available Methods

### cNGNManager Methods

#### Get Balance
```typescript
const balance = await manager.getBalance();
```

#### Get Transaction History
```typescript
const transactions = await manager.getTransactionHistory();
```

#### Swap Between Chains
```typescript
const swapData: Swap = {
    amount: 1000,
    address: '0x789...',
    network: Network.bsc,
    shouldSaveAddress: true
};
const swapResult = await manager.swapBetweenChains(swapData);
```

#### Redeem Asset
```typescript
const redeemData: RedeemAsset = {
    amount: 1000,
    bankCode: '123',
    accountNumber: '1234567890',
    saveDetails: true
};
const redeemResult = await manager.redeemAsset(redeemData);
```

#### Create Virtual Account
```typescript
const mintData: CreateVirtualAccount = {
    provider: 'korapay',
    bank_code: '123'
};
const virtualAccount = await manager.createVirtualAccount(mintData);
```

#### Update Business
```typescript
const updateData: UpdateBusiness = {
    walletAddress: {
        bscAddress: '0x123...',
        // other chain addresses...
    },
    bankDetails: {
        bankName: 'Test Bank',
        bankAccountName: 'Test Account',
        bankAccountNumber: '1234567890'
    }
};
const updateResult = await manager.updateBusiness(updateData);
```

#### Get Banks
```typescript
const banks = await manager.getBanks();
```

### WalletManager Methods

#### Generate Wallet Address
```typescript
const wallet = await WalletManager.generateWalletAddress(Network.bsc);
```

Response format:
```typescript
interface GeneratedWalletAddress {
    mnemonic: string | null;
    address: string;
    network: Network;
    privateKey: string;
}
```

## Testing

The library uses Jest for testing. Tests are organized into two main categories:

### cNGNManager Tests

Tests for the cNGNManager class cover:

1. **Constructor**
    - Proper axios instance creation with correct configuration

2. **API Calls**
    - Balance retrieval
    - Transaction history fetching
    - Chain swapping operations
    - Virtual account creation
    - Business detail updates
    - Bank information retrieval
    - Asset redemption

3. **Error Handling**
    - API errors (400, 500, etc.)
    - Network errors
    - Request setup errors

### WalletManager Tests

Tests for the WalletManager class cover:

1. **Wallet Generation**
    - Generation for all supported networks (BSC, ETH, etc.)
    - Proper address format verification
    - Mnemonic and private key generation

2. **Error Handling**
    - Wallet generation failures
    - Invalid network parameters

### Running Tests

To run the tests:

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

3. Run tests with coverage:
```bash
npm test --coverage
```

Test files follow the naming convention: `*.test.ts` and are located in the `__tests__` directory.

## Error Handling

The library implements comprehensive error handling:

```typescript
try {
    const result = await manager.getBalance();
} catch (error) {
    // Error will contain detailed message about the failure
    console.error(error.message);
}
```

Common error types:
- API errors (with status codes)
- Network connectivity issues
- Invalid parameters
- Wallet generation errors

## Types

The library includes TypeScript definitions for all parameters and return types:

- `Secrets` - API credentials and keys
- `IResponse<T>` - Standard API response wrapper
- `Balance` - Account balance information
- `Transactions` - Transaction details
- `Swap` - Chain swap parameters
- `RedeemAsset` - Asset redemption details
- `Mint` - Virtual account creation parameters
- `UpdateBusiness` - Business update parameters
- `GeneratedWalletAddress` - Wallet generation response

## Security

- Uses AES encryption for request data
- Implements Ed25519 decryption for responses
- Requires secure storage of API credentials

## Contributing

To contribute:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Create a Pull Request

## Support

For support, please:
- Open an issue in the GitHub repository
- Check existing documentation
- Contact the support team

## License

[ISC](https://choosealicense.com/licenses/isc/)