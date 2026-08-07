/**
 * cngn-typescript-library — usage examples
 *
 * Run from the repo root:
 *
 *   npm run example                  # wallet generation only (no credentials needed)
 *   CNGN_API_KEY=... CNGN_ENCRYPTION_KEY=... CNGN_PRIVATE_KEY=... npm run example
 *
 * The imports below are relative so the file runs against the local source. In
 * your own project, import from the package instead:
 *
 *   import { cNGNManager, WalletManager, Blockchain } from 'cngn-typescript-library';
 */
import { cNGNManager, WalletManager, Blockchain } from '../src';

/* -------------------------------------------------------------------------- */
/* 1. Wallet generation — runs locally, no API credentials required            */
/* -------------------------------------------------------------------------- */

/**
 * Wallets are generated per *blockchain family*, not per network. Every EVM
 * network (Ethereum, BSC, Polygon, Base, Asset Chain, Lisk, Monad, Circle Arc,
 * Celo) shares the `m/44'/60'/0'/0/0` derivation path, so a single
 * `Blockchain.EVM` wallet is valid on all of them.
 */
async function generateWallets() {
    const evm = await WalletManager.generateWalletAddress(Blockchain.EVM);
    const tron = await WalletManager.generateWalletAddress(Blockchain.TRON);
    const solana = await WalletManager.generateWalletAddress(Blockchain.SOL);
    const bantu = await WalletManager.generateWalletAddress(Blockchain.XBN);

    // { mnemonic, address, privateKey, blockchain }
    console.log('EVM   ', evm.data?.address, `(${evm.data?.blockchain})`);
    console.log('TRON  ', tron.data?.address);
    console.log('SOL   ', solana.data?.address);
    console.log('XBN   ', bantu.data?.address);

    // ⚠️ These wallets are generated locally and are NOT registered with the
    // cNGN API. Use whitelistAddress() before withdrawing to them, and store
    // the mnemonic/privateKey somewhere safe — they cannot be recovered.
    return evm;
}

/* -------------------------------------------------------------------------- */
/* 2. Client setup                                                            */
/* -------------------------------------------------------------------------- */

/** Never hardcode credentials — read them from the environment. */
function createManager(): cNGNManager | null {
    const { CNGN_API_KEY, CNGN_ENCRYPTION_KEY, CNGN_PRIVATE_KEY } = process.env;

    if (!CNGN_API_KEY || !CNGN_ENCRYPTION_KEY || !CNGN_PRIVATE_KEY) {
        return null;
    }

    return new cNGNManager({
        apiKey: CNGN_API_KEY,
        encryptionKey: CNGN_ENCRYPTION_KEY,
        privateKey: CNGN_PRIVATE_KEY,
    });
}

/* -------------------------------------------------------------------------- */
/* 3. Read-only operations                                                     */
/* -------------------------------------------------------------------------- */

async function readOnlyExamples(manager: cNGNManager) {
    // Balances
    const balance = await manager.getBalance();
    balance.data?.forEach(b => console.log(`${b.asset_code}: ${b.balance}`));

    // Paginated transaction history
    const history = await manager.getTransactionHistory(1, 10);
    console.log('transactions:', history.data?.pagination.count);

    // Supported networks. API calls identify networks by UUID — NOT by the
    // Blockchain enum — and these UUIDs are where you get them from.
    const networks = await manager.getSupportedNetworks(true);
    networks.data?.forEach(n => console.log(`${n.name} (${n.short_name}): ${n.id}`));

    const bscNetworkId = networks.data?.find(n => n.short_name === 'bsc')?.id;

    // Addresses already whitelisted for withdrawal
    const whitelisted = await manager.getWhitelistedAddress(true);
    console.log('whitelisted:', whitelisted.data?.map(w => w.publicKey));

    // Bank directory and account name lookup
    const banks = await manager.getBanks();
    console.log('banks:', banks.data?.length);

    // Standing virtual accounts for funding via bank transfer
    const virtualAccounts = await manager.getVirtualAccount();
    console.log('virtual accounts:', virtualAccounts.data);

    // A bridge quote is read-only — it prices the swap without executing it
    if (bscNetworkId) {
        const baseNetworkId = networks.data?.find(n => n.short_name === 'base')?.id;
        if (baseNetworkId) {
            const quote = await manager.getSwapQuote({
                originNetworkId: bscNetworkId,
                destinationNetworkId: baseNetworkId,
                amount: 1000,
                destinationAddress: '0xfaEcCB96f7C6985E64cfB055221dc512D9fD0845',
            });
            console.log('quote:', quote.data);
        }
    }

    return bscNetworkId;
}

/* -------------------------------------------------------------------------- */
/* 4. Mutating operations                                                      */
/*                                                                             */
/* Defined but deliberately NOT called by the runner below — each one moves     */
/* real money or changes account state. Call them yourself once you have        */
/* substituted your own values.                                                 */
/* -------------------------------------------------------------------------- */

/** Whitelist an address before you can withdraw to it. */
export async function whitelistExample(manager: cNGNManager, networkId: string, address: string) {
    const result = await manager.whitelistAddress({ networkId, address });
    console.log('whitelisted:', result.data);
}

/** Send cNGN on-chain, then poll the reference to confirm it. */
export async function withdrawExample(manager: cNGNManager, networkId: string, address: string) {
    const withdrawal = await manager.withdraw({
        networkId,
        address,
        amount: 1000,
        shouldSaveAddress: false,
    });
    console.log('trxRef:', withdrawal.data?.trxRef);

    if (withdrawal.data?.trxRef) {
        const verified = await manager.verifyWithdrawal(withdrawal.data.trxRef);
        console.log('status:', verified.data?.status);
    }
}

/** Redeem cNGN to a Nigerian bank account. Verify the account first. */
export async function redeemExample(manager: cNGNManager) {
    const account = { bankCode: '011', accountNumber: '0123456789' };

    const verified = await manager.verifyBankAccount(account);
    console.log('account name:', verified.data?.account_name);

    const redeemed = await manager.redeemAsset({
        amount: 1000,
        bankCode: account.bankCode,
        accountNumber: account.accountNumber,
        saveDetails: false,
    });
    console.log('redeem:', redeemed.data);
}

/** Bridge cNGN between networks. */
export async function swapExample(manager: cNGNManager, originNetworkId: string, destinationNetworkId: string) {
    const swap = await manager.swapAsset({
        originNetworkId,
        destinationNetworkId,
        destinationAddress: '0xe27a0DDBfB5F4b2eb1b99e3FB2d43040f3D31F58',
        senderAddress: '0xe27a0DDBfB5F4b2eb1b99e3FB2d43040f3D31F58',
        callbackUrl: 'https://example.com/webhooks/cngn',
    });
    console.log('swap:', swap.data);
}

/** One-off account for collecting a single expected payment. */
export async function temporaryVirtualAccountExample(manager: cNGNManager) {
    const account = await manager.createTemporaryVirtualAccount({
        amount: 50000,
        customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
        accountName: 'Ada Lovelace',
        narration: 'Invoice #1024',
    });
    console.log('pay into:', account.data?.accountNumber, 'expires:', account.data?.expiresAt);
}

/** Update the bank account funds are settled into. */
export async function updateBankAccountExample(manager: cNGNManager) {
    const updated = await manager.updateBankAccount({
        bankName: 'First Bank of Nigeria',
        bankAccountName: 'ADA LOVELACE',
        bankAccountNumber: '0123456789',
    });
    console.log('bank account:', updated.data);
}

/* -------------------------------------------------------------------------- */

async function main() {
    console.log('--- wallet generation ---');
    await generateWallets();

    const manager = createManager();
    if (!manager) {
        console.log('\nSet CNGN_API_KEY, CNGN_ENCRYPTION_KEY and CNGN_PRIVATE_KEY to run the API examples.');
        return;
    }

    console.log('\n--- read-only API calls ---');
    await readOnlyExamples(manager);

    // The mutating examples above are intentionally not invoked. Uncomment one
    // only when you mean to move funds or change account state:
    //
    // await whitelistExample(manager, bscNetworkId, '0x...');
    // await withdrawExample(manager, bscNetworkId, '0x...');
    // await redeemExample(manager);
    // await swapExample(manager, bscNetworkId, baseNetworkId);
    // await temporaryVirtualAccountExample(manager);
    // await updateBankAccountExample(manager);
}

main().catch(error => {
    console.error('example failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
