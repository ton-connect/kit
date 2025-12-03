import { DAppInfo } from "../core/DAppInfo";
import { SignData } from "../core/SignData";

export interface SignDataRequestEvent {
    /**
     * Preview information for UI display
     */
    preview: SignDataRequestEventPreview;
}

export interface SignDataRequestEventPreview {
    /**
     * Decentralized Application information
     */
    dAppInfo?: DAppInfo;

    /**
     * Data to be signed
     */
    data: SignData;
}