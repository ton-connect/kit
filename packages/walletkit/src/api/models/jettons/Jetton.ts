import { Address } from "../core/Primitives";
import { TokenAmount } from "../core/TokenAmount";
import { TokenInfo } from "../core/TokenInfo";

export interface Jetton {
    /**
     * The Jetton contract address
     */
    address: Address;

    /**
     * The Jetton wallet address
     */
    walletAddress?: Address;

    /**
     * The blockchain address of the Jetton master contract
     */
    masterAddress?: Address;

    /**
     * The current jetton balance
     */
    balance?: TokenAmount;

    /**
     * Information about the token
     */
    info?: TokenInfo;

    /**
     * The number of decimal places used by the token
     */
    decimalsNumber?: number;
    verification?: JettonVerification;

    /**
     * Additional metadata related to the jetton
     */
    metadata?: { [key: string]: string };

    /**
     * Additional arbitrary data related to the jetton
     */
    extra?: { [key: string]: unknown };
}

export interface JettonVerification {
    isVerified?: boolean;
    source?: JettonVerificationSource;
    warnings?: string[];
}

// Check source of jetton verification in some wallet JSON using toncenter api
export declare enum JettonVerificationSource {
    toncenter = 'toncenter',
    community = 'community',
    manual = 'manual',
}