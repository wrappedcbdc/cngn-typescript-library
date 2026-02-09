import { secp256k1 } from '@noble/curves/secp256k1';
import keccak256 from 'keccak256';
import * as bip39 from 'bip39';
import { hdkey } from 'ethereumjs-wallet';
import { Network, GeneratedWalletAddress } from "./types";
import { TronWeb } from 'tronweb';
import nacl from 'tweetnacl';
import WAValidator from 'multicoin-address-validator';
import { Keypair } from '@stellar/stellar-sdk';
import * as ed25519 from 'ed25519-hd-key';
import bs58 from 'bs58';

export class CryptoWallet {

    private static MNEMONIC_ENTROPY_BYTES = 128;

    private static DERIVATION_PATHS: { [key in Network]?: string } = {
        [Network.eth]: `m/44'/60'/0'/0/0`,
        [Network.lisk]: `m/44'/60'/0'/0/0`,
        [Network.monad]: `m/44'/60'/0'/0/0`,
        [Network.arc]: `m/44'/60'/0'/0/0`,
        [Network.bsc]: `m/44'/60'/0'/0/0`,
        [Network.atc]: `m/44'/60'/0'/0/0`,
        [Network.matic]: `m/44'/60'/0'/0/0`,
        [Network.trx]: `m/44'/195'/0'/0/0`,
        [Network.xbn]: `m/44'/703'/0'`,
        [Network.sol]: `m/44'/501'/0'/0'`
    };

    static generateWalletWithMnemonicDetails(network: Network): GeneratedWalletAddress {
        const mnemonic = bip39.generateMnemonic(this.MNEMONIC_ENTROPY_BYTES);
        return this.generateWalletFromMnemonic(mnemonic, network);
    }

    private static generateWalletFromMnemonic(mnemonic: string, network: Network): GeneratedWalletAddress {
        if (network === Network.xbn) {
            return this.generateXbnWallet(mnemonic);
        }

        if (network === Network.sol) {
            return this.generateSolWallet(mnemonic);
        }

        const privateKey = this.getPrivateKeyFromMnemonic(mnemonic, network);
        const publicKey = this.getPublicKey(privateKey, network);
        const address = this.getAddressFromPublicKey(publicKey, network);

        if ([Network.trx, Network.eth, Network.matic].includes(network) && !WAValidator.validate(address, network)) {
            return this.generateWalletWithMnemonicDetails(network);
        }

        return { mnemonic, privateKey, address, network };
    }

    private static getPublicKey(privateKey: string, network: Network): string {
        if (network === Network.xbn) {
            const keyPair = nacl.sign.keyPair.fromSeed(Buffer.from(privateKey, 'hex'));
            return Buffer.from(keyPair.publicKey).toString('hex');
        }
        return secp256k1.getPublicKey(privateKey, false).slice(1).toString();
    }

    private static getPrivateKeyFromMnemonic(mnemonic: string, network: Network): string {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const hdWallet = hdkey.fromMasterSeed(seed);
        const derivationPath = this.getDerivationPath(network);

        if (network === Network.xbn) {
            return hdWallet.derivePath(derivationPath).privateExtendedKey().toString('hex').slice(0, 64);
        }
        return hdWallet.derivePath(derivationPath).getWallet().getPrivateKey().toString('hex');
    }

    private static getAddressFromPublicKey(publicKey: string, network: Network): string {
        if (Network.trx === network) return TronWeb.address.fromHex(this.getEthereumStyleAddress(publicKey));
        return this.getEthereumStyleAddress(publicKey);
    }

    private static getEthereumStyleAddress(publicKey: string): string {
        const cleanPublicKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey;
        const hash = keccak256(Buffer.from(cleanPublicKey, 'hex'));
        return '0x' + hash.subarray(-20).toString('hex');
    }

    private static getDerivationPath(network: Network): string {
        const path = this.DERIVATION_PATHS[network];
        if (!path) {
            throw new Error(`Unsupported network: ${network}`);
        }
        return path;
    }

    private static generateXbnWallet(mnemonic: string): GeneratedWalletAddress {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const derivationPath = this.getDerivationPath(Network.xbn);
        const { key } = ed25519.derivePath(derivationPath, seed.toString('hex'));
        const keypair = Keypair.fromRawEd25519Seed(key);
        return {
            mnemonic,
            privateKey: keypair.secret(),
            address: keypair.publicKey(),
            network: Network.xbn,
        };
    }

    private static generateSolWallet(mnemonic: string): GeneratedWalletAddress {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const derivationPath = this.getDerivationPath(Network.sol);
        const { key } = ed25519.derivePath(derivationPath, seed.toString('hex'));
        const keypair = nacl.sign.keyPair.fromSeed(key);
        const publicKeyBase58 = bs58.encode(keypair.publicKey);
        const privateKeyBase58 = bs58.encode(keypair.secretKey);
        return {
            mnemonic,
            privateKey: privateKeyBase58,
            address: publicKeyBase58,
            network: Network.sol,
        };
    }
}