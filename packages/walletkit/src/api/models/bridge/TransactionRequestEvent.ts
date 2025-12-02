import { DAppInfo } from "../core/DAppInfo";
import { TransactionPreview } from "../transactions/emulation/TransactionPreview";
import { TransactionRequest } from "../transactions/TransactionRequest";

export interface TransactionRequestEvent {
    /**
     * Preview information for UI display
     */
    preview: TransactionRequestEventPreview;
    request: TransactionRequest;
}

export interface TransactionRequestEventPreview {
    /**
     * Decentralized Application information
     */
    dAppInfo?: DAppInfo;

    data: TransactionPreview;
}