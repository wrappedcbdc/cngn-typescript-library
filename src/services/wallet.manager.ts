import {GeneratedWalletAddress, IResponse, Network} from "../types";
import {CryptoWallet} from "../utils/crypto.wallet";

export class WalletManager {

    public static async generateWalletAddress(network: Network): Promise<IResponse<GeneratedWalletAddress>> {
        try {
            const response = CryptoWallet.generateWalletWithMnemonicDetails(network);
            return { success: true, data: response };
        }
        catch (error: any) {
            throw new Error(`Error generating wallet: ${error.message}`);
        }
    }

}