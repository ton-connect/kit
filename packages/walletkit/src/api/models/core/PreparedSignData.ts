import { Address, Hex } from "../core/Primitives";
import { Network } from "./Network";
import { SignData } from "./SignData";

export interface PreparedSignData {
    address: Address;
    timestamp: number;
    domain: string;
    payload: PreparedSignDataPayload;
    hash: Hex;
}

export declare type PreparedSignDataPayload = {
    network?: Network;
    from?: string;
    data?: SignData;
};