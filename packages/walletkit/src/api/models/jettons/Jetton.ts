import { Address } from "../core/Primitives";
import { TokenAmount } from "../core/TokenAmount";
import { TokenInfo } from "../core/TokenInfo";

export interface Jetton {
    address: Address;
    walletAddress?: Address;
    masterAddress?: Address;
    balance?: TokenAmount;
    info?: TokenInfo;
    decimalsCount?: number;
    extra?: { [key: string]: unknown };
}

export interface JettonVerification {
    verified?: boolean;
    source?: JettonVerificationSource;
    warnings?: string[];
}

export declare enum JettonVerificationSource {
    toncenter = 'toncenter',
    community = 'community',
    manual = 'manual',
}