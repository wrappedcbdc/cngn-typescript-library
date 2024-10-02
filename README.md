# CNGnManager

CNGnManager is a TypeScript library for interacting with a CNGN API. It provides a simple interface for various operations such as checking balance, swapping between chains, depositing for redemption, creating virtual accounts, and more.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Available Methods](#available-methods)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Types](#types)
- [Security](#security)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation

To install CNGnManager and its dependencies, run:

```bash
npm install cngn-typescript-library
```

## Usage

First, import the `CNGnManager` class and necessary types:

```typescript
import { CNGnManager, Secrets, SwapParams, DepositParams, MintParams, WhiteListAddressParams, Network } from 'cngn-typescript-library';
```

Then, create an instance of `CNGnManager` with your secrets:

```typescript
const secrets: Secrets = {
    apiKey: 'your-api-key',
    privateKey: 'your-private-key',
    encryptionKey: 'your-encryption-key'
};

const manager = new CNGnManager(secrets);

// Example: Get balance
manager.getBalance().then(balance => console.log(balance));
```

## Available Methods

### Get Balance

```typescript
const balance = await manager.getBalance();
console.log(balance);
```

### Get Transaction History

```typescript
const transactions = await manager.getTransactionHistory();
console.log(transactions);
```

### Swap Between Chains

```typescript
const swapParams: SwapParams = {
    amount: 100,
    address: '0x1234...',
    network: Network.bsc
};
const swapResult = await manager.swapBetweenChains(swapParams);
console.log(swapResult);
```

### Deposit for Redemption

```typescript
const depositParams: DepositParams = {
    amount: 1000,
    bank: 'Example Bank',
    accountNumber: '1234567890'
};
const depositResult = await manager.depositForRedemption(depositParams);
console.log(depositResult);
```

### Create Virtual Account

```typescript
const mintParams: MintParams = {
    provider: 'korapay'
};
const virtualAccount = await manager.createVirtualAccount(mintParams);
console.log(virtualAccount);
```

### Whitelist Address

```typescript
const whitelistParams: WhiteListAddressParams = {
    bscAddress: '0x1234...',
    bankName: 'Example Bank',
    bankAccountNumber: '1234567890'
};
const whitelistResult = await manager.whitelistAddress(whitelistParams);
console.log(whitelistResult);
```

## Testing

This project uses Jest for testing. To run the tests, follow these steps:

1. Run the test command:

   ```bash
   npm test
   ```

   This will run all tests in the `__tests__` directory.

### Test Structure

The tests are located in the `__tests__` directory. They cover various aspects of the CNGnManager class, including:

- API calls for different endpoints (GET and POST requests)
- Encryption and decryption of data
- Error handling for various scenarios

## Error Handling

The library uses a custom error handling mechanism. All API errors are caught and thrown as `Error` objects with descriptive messages.

## Types

The library includes TypeScript definitions for all parameters and return types. Please refer to the type definitions in the source code for more details.

## Security

This library uses AES encryption for request payloads and Ed25519 decryption for response data. Ensure that your `encryptionKey` and `privateKey` are kept secure.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check [issues page](https://github.com/asc-africa/cngn-manager/issues) if you want to contribute.

## Support

If you have any questions or need help using the library, please open an issue in the GitHub repository.

## License

[MIT](https://choosealicense.com/licenses/mit/)
