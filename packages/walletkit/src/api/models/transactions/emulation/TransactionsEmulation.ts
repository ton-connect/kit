
import { AddressBookEntry } from "../../core/AddressBook";
import { ExtraCurrencies } from "../../core/ExtraCurrencies";
import { Base64String, Address } from "../../core/Primitives";
import { TokenImage } from "../../core/TokenImage";
import { TokenAmount } from "../../core/TokenAmount";
import { Transaction } from "../Transaction";

export interface TransactionsEmulation {
    /**
     * Masterchain block sequence number where emulation was performed  
     * @format int
     */
    masterchainBlockSeqno: number;
    
    trace: TransactionEmulationTraceNode;
    transactions: { [key: string]: Transaction };
    actions: TransactionEmulationAction[];
    codeCells: { [key: string]: Base64String }; // base64-encoded cells by code hash
    dataCells: { [key: string]: Base64String }; // base64-encoded cells by data hash
    addressBook: { [key: string]: AddressBookEntry };
    metadata: { [key: string]: TransactionEmulationAddressMetadata };
    randSeed: string;
    isIncomplete: boolean;
}


export interface TransactionEmulationTraceNode {
    txHash?: string;
    inMsgHash?: string;
    children: TransactionEmulationTraceNode[];
}

export type TransactionEmulationActionType = 'jetton_swap' | 'call_contract' | string;

export interface TransactionEmulationActionBase {
    traceId?: string;
    actionId: string;
    startLt: string;
    endLt: string;
    startUtime: number;
    endUtime: number;
    traceEndLt: string;
    traceEndUtime: number;
    traceMcSeqnoEnd: number;
    transactions: string[]; // list of tx hashes in this action
    success: boolean;
    type: TransactionEmulationActionType;
    traceExternalHash: string;
    accounts: string[];
}

export type TransactionEmulationActionDetails = 
    | { type: 'jettonSwap', value: TransactionEmulationJettonSwapDetails }
    | { type: 'callContract', value: TransactionEmulationCallContractDetails }
    | { type: 'tonTransfer', value: TransactionEmulationTonTransferDetails }
    | { type: 'unknown', value: { [key: string]: unknown } };

export interface TransactionEmulationJettonSwapDetails {
    dex: string; // e.g. "stonfi"
    sender: Address; // address
    assetIn: string; // jetton master
    assetOut: string; // jetton master
    dexIncomingTransfer?: TransactionEmulationJettonTransfer;
    dexOutgoingTransfer?: TransactionEmulationJettonTransfer;
    peerSwaps: unknown[];
}

export interface TransactionEmulationJettonTransfer {
    asset: string;
    source: Address;
    destination: Address;
    sourceJettonWallet?: Address;
    destinationJettonWallet?: Address;
    amount: TokenAmount;
}

export interface TransactionEmulationCallContractDetails {
    opcode: string;
    source: string;
    destination: string;
    value: string;
    valueExtraCurrencies?: ExtraCurrencies;
}

export interface TransactionEmulationTonTransferDetails {
    source: string;
    destination: string;
    value: string;
    valueExtraCurrencies?: ExtraCurrencies;
    comment?: string | null;
    isEncrypted: boolean;
}

export interface TransactionEmulationAction extends TransactionEmulationActionBase {
    details: TransactionEmulationActionDetails;
}

// Metadata by address
export interface TransactionEmulationAddressMetadata {
    isIndexed: boolean;
    tokenInfo?: TransactionEmulationTokenInfo[];
}

export type TransactionEmulationTokenInfo = 
    | { type: 'jetton_wallets', value: TransactionEmulationTokenInfoJettonWallets }
    | { type: 'jetton_masters', value: TransactionEmulationTokenInfoJettonMasters }
    | { type: 'unknown', value: TransactionEmulationTokenInfoBase };

export type TransactionEmulationTokenInfoBase {
    isValid: boolean;
    type: string;
    extra: { [key: string]: unknown };
}

export interface TransactionEmulationTokenInfoJettonWallets extends TransactionEmulationTokenInfoBase {
    balance: TokenAmount;
    jetton: Address; // jetton master address
    owner: Address;
}

export interface TransactionEmulationTokenInfoJettonMasters extends TransactionEmulationTokenInfoBase {
    name: string;
    symbol: string;
    description: string;
    decimalsCount: number;
    image?: TokenImage;
    social: string[];
    uri: string;
    websites: string[];
}