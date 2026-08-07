import {Blockchain, GeneratedWalletAddress, IResponse} from "../utils/types";
import {CryptoWallet} from "../utils/crypto.wallet";

export class WalletManager {

    public static async generateWalletAddress(blockchain: Blockchain): Promise<IResponse<GeneratedWalletAddress>> {
        try {
            const response = CryptoWallet.generateWalletWithMnemonicDetails(blockchain);
            return { success: true, data: response };
        }
        catch (error: any) {
            throw new Error(`Error generating wallet: ${error.message}`);
        }
    }

}