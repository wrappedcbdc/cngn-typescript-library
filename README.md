# cNGN TypeScript SDK

Node.js client for the cNGN API. Requires Node.js 24 or later.

## Install

```sh
npm install cngn-typescript-library
```

## Setup

Create an Ed25519 key and upload its public key in the cNGN dashboard:

```sh
ssh-keygen -t ed25519 -f ./cngn_ed25519
```

Keep the private key and encryption key secure. Use credentials from the same cNGN environment.

```ts
import { readFileSync } from 'node:fs';
import { CngnClient } from 'cngn-typescript-library';

const client = new CngnClient({
  apiKey: process.env.CNGN_API_KEY!,
  encryptionKey: process.env.CNGN_ENCRYPTION_KEY!,
  privateKey: readFileSync(process.env.CNGN_PRIVATE_KEY_PATH!, 'utf8'),
});

try {
  const balances = await client.getBalance();
  const networks = await client.getNetworks();
  console.log(balances, networks);
} finally {
  client.close();
}
```

`apiKey` uses a `cngn_test_` or `cngn_live_` prefix. The client checks that prefix against the optional `environment` setting. `baseUrl`, `timeoutMs`, and `maxRetries` are configurable.

## API methods

| Method | Operation |
| --- | --- |
| `getBalance(options?)` | List balances |
| `getTransactions(page?, limit?, options?)` | Get a transaction page |
| `iterateTransactions(limit?, options?)` | Iterate transaction pages |
| `getNetworks(includeBlockchain?, options?)` | List networks |
| `getVirtualAccounts(options?)` | List virtual accounts |
| `createTemporaryVirtualAccount(input, options?)` | Create a temporary virtual account |
| `redeemAsset(input, options?)` | Redeem to a bank account |
| `verifyBankAccount(bankCode, accountNumber, options?)` | Verify bank details |
| `getBanks(options?)` | List banks |
| `updateBankAccount(input)` | Update settlement bank details |
| `withdraw(input, options?)` | Withdraw to a wallet |
| `verifyWithdrawal(reference, options?)` | Get a withdrawal |
| `getBridgeQuote(input, options?)` | Get a bridge quote |
| `bridge(input, options?)` | Submit a bridge request |
| `whitelistAddress(networkId, address)` | Add an address |
| `getWhitelistedAddresses(includeNetwork?, options?)` | List saved addresses |

Request bodies are encrypted before transmission. Successful encrypted responses are decrypted by the client. API failures raise `CngnError` with `kind`, `status`, and `response` fields.

Read requests and bank verification may retry after transport errors, HTTP 429, or HTTP 5xx. Transfers and temporary account creation retry only when `options.idempotencyKey` is set. The same key is reused for each attempt. HTTP 429 waits 60 seconds before retrying. Methods with an `options` parameter accept `options.signal` for cancellation.

```ts
const result = await client.withdraw(
  { amount: 100, address: '0x...', networkId: 'network-id' },
  { idempotencyKey: 'withdrawal-123' },
);
```

## Webhooks

Verify the exact request body before parsing it. The signature is read from `X-cNGN-Signature`.

```ts
import { parseWebhook, verifyWebhook } from 'cngn-typescript-library';

const rawBody = Buffer.from(requestBody);
const signature = requestHeaders['x-cngn-signature'];
if (!verifyWebhook(rawBody, signature, process.env.CNGN_WEBHOOK_SECRET!)) {
  throw new Error('Invalid webhook signature');
}
const event = parseWebhook(rawBody);
```

## Wallets

`Wallets.generate()` and `Wallets.fromMnemonic()` support EVM, TRON, SOL, STELLAR, and XBN. Generated wallet objects contain a private key and recovery phrase. Store them securely and keep them out of logs.

```ts
import { Blockchain, Wallets } from 'cngn-typescript-library';

const wallet = Wallets.generate(Blockchain.EVM);
const valid = Wallets.validateAddress(Blockchain.EVM, wallet.address);
```

## Development

```sh
npm ci
npm run check
```
