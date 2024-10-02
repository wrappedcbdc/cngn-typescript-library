import sodium from 'libsodium-wrappers';
import {Buffer} from 'buffer';

export class Ed25519Crypto {

    private static isInitialized = false;

    private static async initialize() {
        if (!this.isInitialized) {
            await sodium.ready;
            this.isInitialized = true;
        }
    }

    private static parseOpenSSHPrivateKey(privateKey: string): Uint8Array {
        const lines = privateKey.split('\n');
        const base64PrivateKey = lines.slice(1, -1).join('');
        const privateKeyBuffer = Buffer.from(base64PrivateKey, 'base64');

        const keyDataStart = privateKeyBuffer.indexOf(Buffer.from([0x00, 0x00, 0x00, 0x40]));
        if (keyDataStart === -1) {
            throw new Error('Unable to find Ed25519 key data');
        }

        return new Uint8Array(privateKeyBuffer.subarray(keyDataStart + 4, keyDataStart + 68));
    }

    public static async decryptWithPrivateKey(ed25519PrivateKey: string, encryptedData: string): Promise<string> {
        await this.initialize();

        try {
            const fullPrivateKey = this.parseOpenSSHPrivateKey(ed25519PrivateKey);
            const curve25519PrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(fullPrivateKey);
            const encryptedBuffer = Buffer.from(encryptedData, 'base64');

            const nonce = encryptedBuffer.subarray(0, sodium.crypto_box_NONCEBYTES);
            const ephemeralPublicKey = encryptedBuffer.subarray(-sodium.crypto_box_PUBLICKEYBYTES);
            const ciphertext = encryptedBuffer.subarray(sodium.crypto_box_NONCEBYTES, -sodium.crypto_box_PUBLICKEYBYTES);

            const decrypted = sodium.crypto_box_open_easy(
                ciphertext,
                nonce,
                ephemeralPublicKey,
                curve25519PrivateKey
            );

            return sodium.to_string(decrypted)
        } catch (error) {
            throw new Error(`Failed to decrypt with the provided Ed25519 private key: ${error}`);
        }
    }

}
