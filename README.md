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
pnpm install cngn-typescript-library
```

## Usage

First, import the necessary classes and types:

```typescript
import { cNGNManager, WalletManager, Secrets, SwapParams, DepositParams, MintParams, WhiteListAddressParams, Network } from 'cngn-typescript-library';
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

The library supports multiple blockchain networks, grouped by their underlying chain technology:

### EVM (Ethereum Virtual Machine) Chains
- `Network.bsc` - Binance Smart Chain Mainnet
- `Network.atc` - Atlantic Chain
- `Network.eth` - Ethereum Mainnet
- `Network.matic` - Polygon (Previously Matic)

### Bantu (Stellar-based)
- `Network.xbn` - XBN Chain

### Tron
- `Network.trx` - Tron Mainnet

Usage example with different chain types:
```typescript
// For EVM chain operations (BSC, ATC, ETH, MATIC)
const evmSwapParams: SwapParams = {
    amount: 100,
    address: '0x1234...',  // EVM-compatible address
    network: Network.bsc   // or Network.atc, Network.eth, Network.matic
};

// For Bantu (XBN) operations
const xbnSwapParams: SwapParams = {
    amount: 100,
    address: 'G....',      // Stellar-compatible address
    network: Network.xbn
};

// For Tron operations
const tronSwapParams: SwapParams = {
    amount: 100,
    address: 'T....',      // Tron address format
    network: Network.trx
};
```

## Available Methods

### cNGNManager Methods

#### Get Balance

```typescript
const balance = await manager.getBalance();
console.log(balance);
```

#### Get Transaction History

```typescript
const transactions = await manager.getTransactionHistory();
console.log(transactions);
```

#### Swap Between Chains

```typescript
const swapParams: SwapParams = {
    amount: 100,
    address: '0x1234...',
    network: Network.bsc
};
const swapResult = await manager.swapBetweenChains(swapParams);
console.log(swapResult);
```

#### Deposit for Redemption

```typescript
const depositParams: DepositParams = {
    amount: 1000,
    bank: 'Example Bank',
    accountNumber: '1234567890'
};
const depositResult = await manager.depositForRedemption(depositParams);
console.log(depositResult);
```

#### Create Virtual Account

```typescript
const mintParams: MintParams = {
    provider: 'korapay'
};
const virtualAccount = await manager.createVirtualAccount(mintParams);
console.log(virtualAccount);
```

#### Whitelist Address

```typescript
const whitelistParams: WhiteListAddressParams = {
    bscAddress: '0x1234...',
    bankName: 'Example Bank',
    bankAccountNumber: '1234567890'
};
const whitelistResult = await manager.whitelistAddress(whitelistParams);
console.log(whitelistResult);
```

### WalletManager Methods

#### Generate Wallet Address

The `generateWalletAddress` method creates a new wallet address for any supported network. Each network type returns addresses in its native format.

```typescript
// EVM Chains (returns 0x-prefixed addresses)
const bscWallet = await WalletManager.generateWalletAddress(Network.bsc);    // BSC address
const ethWallet = await WalletManager.generateWalletAddress(Network.eth);    // Ethereum address
const maticWallet = await WalletManager.generateWalletAddress(Network.matic); // Polygon address
const atcWallet = await WalletManager.generateWalletAddress(Network.atc);    // Atlantic Chain address

// Bantu/Stellar-based Chain (returns G-prefixed addresses)
const xbnWallet = await WalletManager.generateWalletAddress(Network.xbn);    // XBN address

// Tron Chain (returns T-prefixed addresses)
const tronWallet = await WalletManager.generateWalletAddress(Network.trx);   // Tron address
```

The response format for each generated wallet:
```typescript
interface WalletResponse {
    address: string;        // The public address for the wallet
    network: Network;       // The network this wallet is for
    mnemonic: string;      // 12-word recovery phrase
    privateKey: string;    // Private key for the wallet
}
```

Example response:
```typescript
// EVM wallet response
{
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    network: Network.eth,
    mnemonic: "width craft decide...",
    privateKey: "0x..."
}

// XBN wallet response
{
    address: "GBXYZABC...",
    network: Network.xbn,
    mnemonic: "width craft decide...",
    privateKey: "S..."
}

// Tron wallet response
{
    address: "TRxYZABC...",
    network: Network.trx,
    mnemonic: "width craft decide...",
    privateKey: "..."
}
```

**Note:** Each network type has its own address format:
- EVM chains (BSC, ETH, MATIC, ATC): `0x`-prefixed addresses
- Bantu/XBN: `G`-prefixed addresses (Stellar format)
- Tron: `T`-prefixed addresses

## Testing

This project uses Jest for testing. To run the tests, follow these steps:

1. Run the test command:

   ```bash
   npm test
   ```

   This will run all tests in the `__tests__` directory.

### Test Structure

The tests are located in the `__tests__` directory. They cover various aspects of the cNGNManager and WalletManager classes, including:

- API calls for different endpoints (GET and POST requests)
- Encryption and decryption of data
- Error handling for various scenarios
- Wallet address generation for different networks

## Error Handling

The library uses a custom error handling mechanism. All API errors are caught and thrown as `Error` objects with descriptive messages.

## Types

The library includes TypeScript definitions for all parameters and return types. All types are defined in a single `types.ts` file for easy reference and maintenance.

## Security

This library uses AES encryption for request payloads and Ed25519 decryption for response data. Ensure that your `encryptionKey` and `privateKey` are kept secure.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check [issues page](https://github.com/wrappedcbdc/cngn-typescript-library/issues) if you want to contribute.

## Support

If you have any questions or need help using the library, please open an issue in the GitHub repository.

## License

[ISC](https://choosealicense.com/licenses/isc/)