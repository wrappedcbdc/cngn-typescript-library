import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { CngnClient, CngnError, verifyWebhook } from '../dist/index.js';

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  if (process.env.CNGN_LIVE_TESTS !== '1') {
    throw new Error('Set CNGN_LIVE_TESTS=1 to run live tests');
  }
  const apiKey = required('CNGN_API_KEY');
  if (!apiKey.startsWith('cngn_test_')) {
    throw new Error('Live tests require a cngn_test_ API key');
  }
  const client = new CngnClient({
    apiKey,
    environment: 'test',
    encryptionKey: required('CNGN_ENCRYPTION_KEY'),
    privateKey: readFileSync(required('CNGN_PRIVATE_KEY_PATH'), 'utf8'),
    maxRetries: 0,
    timeoutMs: 20_000,
  });
  let failures = 0;
  async function check(name, call) {
    try {
      await call();
      console.log(`pass ${name}`);
    } catch (error) {
      failures++;
      const kind = error instanceof CngnError ? error.kind : 'unexpected';
      const status = error instanceof CngnError && error.status ? ` HTTP ${error.status}` : '';
      console.error(`fail ${name}: ${kind}${status}`);
    }
  }

  try {
    await check('verifyWebhook fixture', () => {
      const secret = required('CNGN_SIGNING_SECRET');
      const rawBody = Buffer.from('{"event":"sdk.test","data":{"reference":"fixture"}}');
      const signature = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
      const tampered = Buffer.from(rawBody);
      tampered[0] ^= 1;
      if (!verifyWebhook(rawBody, signature, secret)
          || verifyWebhook(tampered, signature, secret)) {
        throw new Error('Webhook signature check failed');
      }
    });
    await check('getBalance', () => client.getBalance());
    await check('getTransactions', () => client.getTransactions(1, 10));
    await check('iterateTransactions', async () => {
      for await (const _transaction of client.iterateTransactions(10)) break;
    });
    await check('getNetworks', () => client.getNetworks());
    await check('getNetworks includeBlockchain', () => client.getNetworks(true));
    await check('getVirtualAccounts', () => client.getVirtualAccounts());
    await check('getBanks', () => client.getBanks());
    await check('getWhitelistedAddresses', () => client.getWhitelistedAddresses());
    await check('getWhitelistedAddresses includeNetwork', () => client.getWhitelistedAddresses(true));

    const reference = process.env.CNGN_TEST_WITHDRAWAL_REFERENCE;
    if (reference?.trim()) {
      await check('verifyWithdrawal', () => client.verifyWithdrawal(reference));
    } else {
      console.log('skip verifyWithdrawal: CNGN_TEST_WITHDRAWAL_REFERENCE is unset');
    }

    const bankCode = process.env.CNGN_TEST_BANK_CODE;
    const accountNumber = process.env.CNGN_TEST_ACCOUNT_NUMBER;
    if (bankCode?.trim() && accountNumber?.trim()) {
      await check('verifyBankAccount', () => client.verifyBankAccount(bankCode, accountNumber));
    } else {
      console.log('skip verifyBankAccount: bank test inputs are unset');
    }

    const amountText = process.env.CNGN_TEST_BRIDGE_AMOUNT;
    const originNetworkId = process.env.CNGN_TEST_ORIGIN_NETWORK_ID;
    const destinationNetworkId = process.env.CNGN_TEST_DESTINATION_NETWORK_ID;
    const destinationAddress = process.env.CNGN_TEST_DESTINATION_ADDRESS;
    if (amountText?.trim() && originNetworkId?.trim() && destinationNetworkId?.trim()
        && destinationAddress?.trim()) {
      const amount = Number(amountText);
      await check('getBridgeQuote', () => client.getBridgeQuote({
        amount, originNetworkId, destinationNetworkId, destinationAddress,
      }));
    } else {
      console.log('skip getBridgeQuote: bridge test inputs are unset');
    }
  } finally {
    client.close();
  }
  if (failures) process.exitCode = 1;
}

main().catch(() => {
  console.error('Live smoke setup failed. Check the test flag, credentials, and key path.');
  process.exitCode = 1;
});
