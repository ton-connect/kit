import { DAppInfo } from "../core/DAppInfo";

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

    data: SignDataPreview;
}


export interface SignDataPreviewText {
    /**
     * @const text
     */
    kind: 'text';
    content: string;
}

export interface SignDataPreviewBinary {
    /**
     * @const binary
     */
    kind: 'binary';
    content: string;
}

export interface SignDataPreviewCell {
    /**
     * @const cell
     */
    kind: 'cell';
    content: string;
    schema?: string;
}

/**
 * Preview data for signing
 * @oneOf
 * @discriminator kind
 */
export type SignDataPreview = SignDataPreviewText | SignDataPreviewBinary | SignDataPreviewCell;