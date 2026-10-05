import sdk = require('cngn-typescript-library');

const wallet: sdk.GeneratedWallet = sdk.Wallets.fromMnemonic(
  sdk.Blockchain.EVM,
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
);
void wallet;
