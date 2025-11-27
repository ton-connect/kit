import { Address } from "../core/primitives";
import { TokenAmount } from "../core/TokenAmount";

export interface JettonsTransferRequest {
    /**
     * Jetton contract address
     */
    jettonAddress: Address;

    /**
     * Amount to transfer in jeton's smallest unit
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