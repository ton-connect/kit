import { Address } from "../core/primitives";
import { TokenAmount } from "../core/TokenAmount";

export interface NFTTransferRequest {
    /**
     * NFT contract address
     */
    nftAddress: Address;

    /**
     * Amount to transfer in nanotons, default is "100000000" (0.1 TON)
     */
    transferAmount?: TokenAmount;

    /**
     * Recipient address
     */
    recipientAddress: Address;

    /**
     * Optional comment for the transfer
     */
    comment?: string;
}