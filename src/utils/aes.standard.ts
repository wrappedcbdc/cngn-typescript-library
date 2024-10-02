import * as crypto from 'crypto';

export type AESEncryptionResponse = {
    iv: string,
    content: string
}

export class AESCrypto {
    private static readonly ALGORITHM = 'aes-256-cbc';
    private static readonly IV_LENGTH = 16;
    private static readonly KEY_LENGTH = 32; // 256 bits

    private static prepareKey(key: string): Buffer {
        // Hash the key to ensure it's always the correct length
        const hash = crypto.createHash('sha256');
        hash.update(key);
        return hash.digest();
    }

    public static encrypt(data: string, key: string): AESEncryptionResponse {
        const iv = crypto.randomBytes(this.IV_LENGTH);
        const keyBuffer = this.prepareKey(key);

        const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);

        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        return {
            content: encrypted,
            iv: iv.toString('base64')
        };
    }

    public static decrypt(encryptedData: AESEncryptionResponse, key: string): string {
        const iv = Buffer.from(encryptedData.iv, 'base64');
        const keyBuffer = this.prepareKey(key);

        const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);

        let decrypted = decipher.update(encryptedData.content, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
