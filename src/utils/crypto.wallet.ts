import { secp256k1 } from '@noble/curves/secp256k1';
import keccak256 from 'keccak256';
import * as bip39 from 'bip39';
import { hdkey } from 'ethereumjs-wallet';
import { Blockchain, GeneratedWalletAddress } from "./types";
import { TronWeb } from 'tronweb';
import nacl from 'tweetnacl';
import WAValidator from 'multicoin-address-validator';
import { Keypair } from '@stellar/stellar-sdk';
import * as ed25519 from 'ed25519-hd-key';
import bs58 from 'bs58';

export class CryptoWallet {

    private static MNEMONIC_ENTROPY_BYTES = 256;

    private static DERIVATION_PATHS: { [key in Blockchain]: string } = {
        [Blockchain.EVM]: `m/44'/60'/0'/0/0`,
        [Blockchain.TRON]: `m/44'/195'/0'/0/0`,
        [Blockchain.XBN]: `m/44'/703'/0'`,
        [Blockchain.SOL]: `m/44'/501'/0'/0'`
    };

    /** Currency codes understood by multicoin-address-validator, per blockchain. */
    private static VALIDATOR_CURRENCIES: { [key in Blockchain]?: string } = {
        [Blockchain.EVM]: 'eth',
        [Blockchain.TRON]: 'trx'
    };

    static generateWalletWithMnemonicDetails(blockchain: Blockchain): GeneratedWalletAddress {
        const mnemonic = bip39.generateMnemonic(this.MNEMONIC_ENTROPY_BYTES);
        return this.generateWalletFromMnemonic(mnemonic, blockchain);
    }

    private static generateWalletFromMnemonic(mnemonic: string, blockchain: Blockchain): GeneratedWalletAddress {
        if (blockchain === Blockchain.XBN) {
            return this.generateXbnWallet(mnemonic);
        }

        if (blockchain === Blockchain.SOL) {
            return this.generateSolWallet(mnemonic);
        }

        const privateKey = this.getPrivateKeyFromMnemonic(mnemonic, blockchain);
        const publicKey = this.getPublicKey(privateKey, blockchain);
        const address = this.getAddressFromPublicKey(publicKey, blockchain);

        const validatorCurrency = this.VALIDATOR_CURRENCIES[blockchain];
        if (validatorCurrency && !WAValidator.validate(address, validatorCurrency)) {
            return this.generateWalletWithMnemonicDetails(blockchain);
        }

        return { mnemonic, privateKey, address, blockchain };
    }

    private static getPublicKey(privateKey: string, blockchain: Blockchain): string {
        if (blockchain === Blockchain.XBN) {
            const keyPair = nacl.sign.keyPair.fromSeed(Buffer.from(privateKey, 'hex'));
            return Buffer.from(keyPair.publicKey).toString('hex');
        }
        return secp256k1.getPublicKey(privateKey, false).slice(1).toString();
    }

    private static getPrivateKeyFromMnemonic(mnemonic: string, blockchain: Blockchain): string {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const hdWallet = hdkey.fromMasterSeed(seed);
        const derivationPath = this.getDerivationPath(blockchain);

        if (blockchain === Blockchain.XBN) {
            return hdWallet.derivePath(derivationPath).privateExtendedKey().toString('hex').slice(0, 64);
        }
        return hdWallet.derivePath(derivationPath).getWallet().getPrivateKey().toString('hex');
    }

    private static getAddressFromPublicKey(publicKey: string, blockchain: Blockchain): string {
        if (Blockchain.TRON === blockchain) return TronWeb.address.fromHex(this.getEthereumStyleAddress(publicKey));
        return this.getEthereumStyleAddress(publicKey);
    }

    private static getEthereumStyleAddress(publicKey: string): string {
        const cleanPublicKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey;
        const hash = keccak256(Buffer.from(cleanPublicKey, 'hex'));
        return '0x' + hash.subarray(-20).toString('hex');
    }

    private static getDerivationPath(blockchain: Blockchain): string {
        const path = this.DERIVATION_PATHS[blockchain];
        if (!path) {
            throw new Error(`Unsupported blockchain: ${blockchain}`);
        }
        return path;
    }

    private static generateXbnWallet(mnemonic: string): GeneratedWalletAddress {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const derivationPath = this.getDerivationPath(Blockchain.XBN);
        const { key } = ed25519.derivePath(derivationPath, seed.toString('hex'));
        const keypair = Keypair.fromRawEd25519Seed(key);
        return {
            mnemonic,
            privateKey: keypair.secret(),
            address: keypair.publicKey(),
            blockchain: Blockchain.XBN,
        };
    }

    private static generateSolWallet(mnemonic: string): GeneratedWalletAddress {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const derivationPath = this.getDerivationPath(Blockchain.SOL);
        const { key } = ed25519.derivePath(derivationPath, seed.toString('hex'));
        const keypair = nacl.sign.keyPair.fromSeed(key);
        const publicKeyBase58 = bs58.encode(keypair.publicKey);
        const privateKeyBase58 = bs58.encode(keypair.secretKey);
        return {
            mnemonic,
            privateKey: privateKeyBase58,
            address: publicKeyBase58,
            blockchain: Blockchain.SOL,
        };
    }
}
