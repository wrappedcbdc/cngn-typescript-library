import sodium from 'libsodium-wrappers';

export const BOX_VECTOR = 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDnjFK7eDgrvJLL/GOccUK+glTymjxdmp8CfFpye8Bh2bj/F514xMD1oSKdc+HWqsqIr3RfOLUlJYDPZ3zt9DOjTrRzLYz7HtwwXgUpcduzQKWhQUNNEdFugWHDlh9WQ==';

function sshString(value: Uint8Array | string): Buffer {
  const bytes = typeof value === 'string' ? Buffer.from(value) : Buffer.from(value);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  return Buffer.concat([length, bytes]);
}

export async function testKey(): Promise<{ pem: string; seed: Buffer; publicKey: Buffer }> {
  await sodium.ready;
  const seed = Buffer.alloc(32, 1);
  const pair = sodium.crypto_sign_seed_keypair(seed);
  const publicKey = Buffer.from(pair.publicKey);
  const check = Buffer.alloc(8);
  check.writeUInt32BE(42, 0);
  check.writeUInt32BE(42, 4);
  const publicBlock = Buffer.concat([sshString('ssh-ed25519'), sshString(publicKey)]);
  const privateParts = Buffer.concat([
    check, sshString('ssh-ed25519'), sshString(publicKey),
    sshString(Buffer.concat([seed, publicKey])), sshString(''),
  ]);
  const padSize = 8 - (privateParts.length % 8);
  const padding = Buffer.from(Array.from({ length: padSize }, (_, index) => index + 1));
  const keyCount = Buffer.alloc(4);
  keyCount.writeUInt32BE(1);
  const blob = Buffer.concat([
    Buffer.from('openssh-key-v1\0'), sshString('none'), sshString('none'), sshString(''),
    keyCount, sshString(publicBlock), sshString(Buffer.concat([privateParts, padding])),
  ]);
  return {
    pem: `-----BEGIN OPENSSH PRIVATE KEY-----\n${blob.toString('base64')}\n-----END OPENSSH PRIVATE KEY-----\n`,
    seed,
    publicKey,
  };
}

export function success(data: unknown): Response {
  return Response.json({ status: 200, data });
}
