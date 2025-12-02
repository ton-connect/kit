import { ExtraCurrencies } from "../core/ExtraCurrencies";
import { Network } from "../core/Network";
import { 
    Address, 
    Base64String, 
} from "../core/Primitives";
import { SendMode } from "../core/SendMode";
import { TokenAmount } from "../core/TokenAmount";

export interface TransactionRequest {
    messages: TransactionRequestMessage[];
    network?: Network;
    validUntil?: number;
    fromAddress?: Address;
}
    
export interface TransactionRequestMessage {
    /**
     * Recipient address
     */
    recipientAddress: Address;

    /**
     * Amount to transfer in nanounits
     */
    transferAmount: TokenAmount;

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
}
