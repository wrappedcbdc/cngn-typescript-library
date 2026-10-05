import { readFileSync } from 'node:fs';
import { CngnClient, CngnError } from '../dist/index.js';

const OPERATIONS = new Set([
  'createTemporaryVirtualAccount', 'updateBankAccount', 'whitelistAddress',
  'redeemAsset', 'withdraw', 'bridge',
]);

class SetupError extends Error {}

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new SetupError(`${name} is required`);
  return value;
}

function amount(name, minimum = 0) {
  const raw = required(name);
  const capRaw = required('CNGN_TEST_MAX_AMOUNT');
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw)) {
    throw new SetupError(`${name} must be a positive decimal amount`);
  }
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(capRaw)) {
    throw new SetupError('CNGN_TEST_MAX_AMOUNT must be a positive decimal amount');
  }
  const value = Number(raw);
  const cap = Number(capRaw);
  if (!Number.isFinite(value) || !Number.isFinite(cap) || cap <= 0
      || value <= 0 || value < minimum || value > cap || value > Number.MAX_SAFE_INTEGER) {
    throw new SetupError(`${name} is outside the supported amount range`);
  }
  return value;
}

function accountNumber(name) {
  const value = required(name);
  if (!/^\d{10}$/.test(value)) throw new SetupError(`${name} must have 10 digits`);
  return value;
}

function idempotencyKey(name) {
  const value = required(name);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
    throw new SetupError(`${name} must contain 1 to 128 safe header characters`);
  }
  return value;
}

function selectedOperations() {
  const names = required('CNGN_MUTATION_OPERATIONS').split(',').map(name => name.trim());
  if (names.some(name => !OPERATIONS.has(name)) || new Set(names).size !== names.length) {
    throw new SetupError('CNGN_MUTATION_OPERATIONS contains an unknown or repeated name');
  }
  return names;
}

function prepare(client, operation) {
  switch (operation) {
    case 'createTemporaryVirtualAccount': {
      const accountName = required('CNGN_TEST_TEMP_ACCOUNT_NAME');
      if (accountName.length < 3 || accountName.length > 50) {
        throw new SetupError('CNGN_TEST_TEMP_ACCOUNT_NAME must have 3 to 50 characters');
      }
      const input = {
        amount: amount('CNGN_TEST_TEMP_ACCOUNT_AMOUNT', 100),
        customer: {
          email: required('CNGN_TEST_CUSTOMER_EMAIL'),
          name: required('CNGN_TEST_CUSTOMER_NAME'),
        },
        accountName,
      };
      const key = idempotencyKey('CNGN_TEST_TEMP_ACCOUNT_IDEMPOTENCY_KEY');
      return { operation, key, call: async () => {
        const result = await client.createTemporaryVirtualAccount(input, { idempotencyKey: key });
        if (!result.reference || !result.accountNumber) throw new Error('Incomplete temporary account response');
      } };
    }
    case 'updateBankAccount': {
      const input = {
        bankName: required('CNGN_TEST_BANK_NAME'),
        bankAccountName: required('CNGN_TEST_BANK_ACCOUNT_NAME'),
        bankAccountNumber: accountNumber('CNGN_TEST_BANK_ACCOUNT_NUMBER'),
      };
      return { operation, call: () => client.updateBankAccount(input) };
    }
    case 'whitelistAddress': {
      const networkId = required('CNGN_TEST_WHITELIST_NETWORK_ID');
      const address = required('CNGN_TEST_WHITELIST_ADDRESS');
      return { operation, call: async () => {
        const result = await client.whitelistAddress(networkId, address);
        if (!Array.isArray(result) || !result.some(entry =>
          typeof entry?.publicKey === 'string'
          && entry.publicKey.toLowerCase() === address.toLowerCase())) {
          throw new Error('Whitelist response does not contain the address');
        }
      } };
    }
    case 'redeemAsset': {
      const input = {
        amount: amount('CNGN_TEST_REDEEM_AMOUNT', 1),
        bankCode: required('CNGN_TEST_REDEEM_BANK_CODE'),
        accountNumber: accountNumber('CNGN_TEST_REDEEM_ACCOUNT_NUMBER'),
        saveDetails: false,
      };
      const key = idempotencyKey('CNGN_TEST_REDEEM_IDEMPOTENCY_KEY');
      return { operation, key, call: async () => {
        const result = await client.redeemAsset(input, { idempotencyKey: key });
        if (!result.trxRef || !result.address) throw new Error('Incomplete redemption response');
      } };
    }
    case 'withdraw': {
      const input = {
        amount: amount('CNGN_TEST_WITHDRAW_AMOUNT'),
        address: required('CNGN_TEST_WITHDRAW_ADDRESS'),
        networkId: required('CNGN_TEST_WITHDRAW_NETWORK_ID'),
        shouldSaveAddress: false,
      };
      const key = idempotencyKey('CNGN_TEST_WITHDRAW_IDEMPOTENCY_KEY');
      return { operation, key, call: async () => {
        const result = await client.withdraw(input, { idempotencyKey: key });
        if (!result.trxRef) throw new Error('Missing withdrawal reference');
        const verified = await client.verifyWithdrawal(result.trxRef);
        if (verified.trx_ref !== result.trxRef) throw new Error('Withdrawal reference mismatch');
      } };
    }
    case 'bridge': {
      const input = {
        originNetworkId: required('CNGN_TEST_BRIDGE_ORIGIN_NETWORK_ID'),
        destinationNetworkId: required('CNGN_TEST_BRIDGE_DESTINATION_NETWORK_ID'),
        destinationAddress: required('CNGN_TEST_BRIDGE_DESTINATION_ADDRESS'),
      };
      const key = idempotencyKey('CNGN_TEST_BRIDGE_IDEMPOTENCY_KEY');
      return { operation, key, call: async () => {
        const result = await client.bridge(input, { idempotencyKey: key });
        if (!result.receivableAddress || !result.reference) throw new Error('Incomplete bridge response');
      } };
    }
    default:
      throw new SetupError('Unknown mutation operation');
  }
}

async function main() {
  if (process.env.CNGN_LIVE_TESTS !== '1' || process.env.CNGN_LIVE_MUTATIONS !== '1') {
    throw new SetupError('Set CNGN_LIVE_TESTS=1 and CNGN_LIVE_MUTATIONS=1');
  }
  const operations = selectedOperations();
  const apiKey = required('CNGN_API_KEY');
  if (!apiKey.startsWith('cngn_test_')) {
    throw new SetupError('Mutation tests require a cngn_test_ API key');
  }
  const client = new CngnClient({
    apiKey,
    environment: 'test',
    encryptionKey: required('CNGN_ENCRYPTION_KEY'),
    privateKey: readFileSync(required('CNGN_PRIVATE_KEY_PATH'), 'utf8'),
    maxRetries: 0,
    timeoutMs: 20_000,
  });
  try {
    const prepared = operations.map(operation => prepare(client, operation));
    const keys = prepared.flatMap(item => item.key ? [item.key] : []);
    if (new Set(keys).size !== keys.length) {
      throw new SetupError('Use a distinct idempotency key for each selected operation');
    }
    let failures = 0;
    for (const item of prepared) {
      try {
        await item.call();
        console.log(`pass ${item.operation}`);
      } catch (error) {
        failures++;
        const kind = error instanceof CngnError ? error.kind : 'unexpected';
        const status = error instanceof CngnError && error.status ? ` HTTP ${error.status}` : '';
        console.error(`fail ${item.operation}: ${kind}${status}`);
        break;
      }
    }
    if (failures) process.exitCode = 1;
  } finally {
    client.close();
  }
}

main().catch(error => {
  if (error instanceof SetupError) console.error(`Mutation test setup failed: ${error.message}`);
  else console.error('Mutation test setup failed. Check credentials and key path.');
  process.exitCode = 1;
});
