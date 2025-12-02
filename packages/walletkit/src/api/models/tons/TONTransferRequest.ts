import { SendMode } from "@ton/core";
import { ExtraCurrencies } from "../core/ExtraCurrencies";
import { Address, Base64String } from "../core/Primitives";
import { TokenAmount } from "../core/TokenAmount";

export interface TONTransferRequest {
    /**
     * Amount to transfer in nanotons
     */
    transferAmount: TokenAmount;

    /**
     * Recipient address
     */
    recipientAddress: Address;

    /**
     * Optional send mode
     */
    mode?: SendMode;

    /**
     * Optional extra currency to send
     */
    extraCurrency?: ExtraCurrencies;

    /**
     * Optional state init in base64 format
     */
    stateInit?: Base64String;
    
    /**
     * Optional payload in base64 format
     */
    payload?: Base64String;

    /**
     * Optional comment for the transfer
     */
    comment?: string;
}