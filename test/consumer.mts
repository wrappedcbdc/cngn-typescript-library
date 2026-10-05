import { Blockchain, Wallets, type GeneratedWallet } from 'cngn-typescript-library';

const wallet: GeneratedWallet = Wallets.fromMnemonic(
  Blockchain.EVM,
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
);
void wallet;
