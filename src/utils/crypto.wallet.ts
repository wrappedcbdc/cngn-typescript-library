import { ec as EC } from 'elliptic';
import keccak256 from 'keccak256';
import * as bip39 from 'bip39';
import { hdkey } from 'ethereumjs-wallet';
import { Network, GeneratedWalletAddress } from "../types";
import {TronWeb} from 'tronweb';

export class CryptoWallet {
    private static ec = new EC('secp256k1');
    private static MNEMONIC_ENTROPY_BYTES = 128; // 128 bits for a 12-word mnemonic phrase

    static getPublicKey(privateKey: string): string {
        const keyPair = this.ec.keyFromPrivate(privateKey, 'hex');
        return keyPair.getPublic('hex');
    }

    private static getEthereumStyleAddress(publicKey: string): string {
        const cleanPublicKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey;
        const hash = keccak256(Buffer.from(cleanPublicKey, 'hex'));
        return '0x' + hash.slice(-20).toString('hex');
    }

    private static getTronAddress(publicKey: string): string {
        const ethAddress = this.getEthereumStyleAddress(publicKey);
        return TronWeb.address.fromHex(ethAddress);
    }

    static generateMnemonic(): string {
        return bip39.generateMnemonic(this.MNEMONIC_ENTROPY_BYTES);
    }

    // Mapping derivation paths for each network
    private static readonly DERIVATION_PATHS: { [key in Network]?: string } = {
        [Network.eth]: `m/44'/60'/0'/0/0`,
        [Network.bsc]: `m/44'/60'/0'/0/0`,
        [Network.atc]: `m/44'/60'/0'/0/0`,
        [Network.xbn]: `m/44'/60'/0'/0/0`,
        [Network.matic]: `m/44'/60'/0'/0/0`,
        [Network.trx]: `m/44'/195'/0'/0/0`
    };

    private static getDerivationPath(network: Network): string {
        const path = this.DERIVATION_PATHS[network];
        if (!path) {
            throw new Error(`Unsupported network: ${network}`);
        }
        return path;
    }

    static getPrivateKeyFromMnemonic(mnemonic: string, network: Network): string {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const hdWallet = hdkey.fromMasterSeed(seed);
        const derivationPath = this.getDerivationPath(network);
        const key = hdWallet.derivePath(derivationPath).getWallet();
        return key.getPrivateKey().toString('hex');
    }

    static getAddressFromPublicKey(publicKey: string, network: Network): string {
        switch (network) {
            case Network.eth:
            case Network.bsc:
            case Network.atc:
            case Network.xbn:
            case Network.matic:
                return this.getEthereumStyleAddress(publicKey);
            case Network.trx:
                return this.getTronAddress(publicKey);
            default:
                throw new Error(`Unsupported network: ${network}`);
        }
    }

    static generateWalletFromMnemonic(mnemonic: string, network: Network): GeneratedWalletAddress {
        const privateKey = this.getPrivateKeyFromMnemonic(mnemonic, network);
        const publicKey = this.getPublicKey(privateKey);
        const address = this.getAddressFromPublicKey(publicKey, network);
        return {
            mnemonic,
            privateKey,
            address,
            network
        };
    }

    static generateWalletWithMnemonic(network: Network): GeneratedWalletAddress {
        const mnemonic = this.generateMnemonic();
        return this.generateWalletFromMnemonic(mnemonic, network);
    }
}
