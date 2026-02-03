/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Intent types for TonConnect deep-link flows.
 *
 * Intents allow dApps to prepare actions and hand them to wallets
 * without requiring a prior TonConnect session.
 *
 * @see https://github.com/the-ton-tech/ton-connect/blob/feature/instant-transactions/requests-responses.md#intents
 */

import type { ConnectRequest } from '@tonconnect/protocol';

// ============================================================================
// Intent Item Types (shared across txIntent and signMsg)
// ============================================================================

/**
 * TON transfer intent item
 */
export interface SendTonIntentItem {
    /** Intent type */
    t: 'ton';
    /** Message destination in user-friendly format */
    a: string;
    /** Number of nanocoins to send as a decimal string */
    am: string;
    /** Raw one-cell BoC encoded in Base64 (payload) */
    p?: string;
    /** Raw one-cell BoC encoded in Base64 (stateInit) */
    si?: string;
    /** Extra currencies to send with the message */
    ec?: Record<string, string>;
}

/**
 * Jetton transfer intent item
 */
export interface SendJettonIntentItem {
    /** Intent type */
    t: 'jetton';
    /** Jetton master contract address */
    ma: string;
    /** Arbitrary request number (query_id) */
    qi?: number;
    /** Amount of transferring jettons in elementary units */
    ja: string;
    /** Address of the new owner of the jettons (destination) */
    d: string;
    /** Response destination address (defaults to user's address) */
    rd?: string;
    /** Custom payload BoC (Base64) */
    cp?: string;
    /** Forward TON amount in nanotons */
    fta?: string;
    /** Forward payload BoC (Base64) */
    fp?: string;
}

/**
 * NFT transfer intent item
 */
export interface SendNftIntentItem {
    /** Intent type */
    t: 'nft';
    /** Address of the NFT item to transfer */
    na: string;
    /** Arbitrary request number (query_id) */
    qi?: number;
    /** Address of the new owner of the NFT */
    no: string;
    /** Response destination address (defaults to user's address) */
    rd?: string;
    /** Custom payload BoC (Base64) */
    cp?: string;
    /** Forward TON amount in nanotons */
    fta?: string;
    /** Forward payload BoC (Base64) */
    fp?: string;
}

/**
 * Union type for all intent items
 */
export type IntentItem = SendTonIntentItem | SendJettonIntentItem | SendNftIntentItem;

// ============================================================================
// Sign Data Payload Types (for signIntent)
// ============================================================================

/**
 * Text sign data payload
 */
export interface TextSignDataPayload {
    type: 'text';
    text: string;
}

/**
 * Binary sign data payload
 */
export interface BinarySignDataPayload {
    type: 'binary';
    bytes: string; // base64 encoded
}

/**
 * Cell sign data payload
 */
export interface CellSignDataPayload {
    type: 'cell';
    schema: string; // TL-B schema
    cell: string; // base64 encoded BoC
}

/**
 * Union type for sign data payloads
 */
export type SignDataIntentPayload = TextSignDataPayload | BinarySignDataPayload | CellSignDataPayload;

// ============================================================================
// Intent Request Types
// ============================================================================

/**
 * Base interface for all intent requests
 */
export interface BaseIntentRequest {
    /** Request ID */
    id: string;
    /** Optional connect request to establish connection after intent */
    c?: ConnectRequest;
}

/**
 * Send Transaction Intent request
 * Sends the transaction to the blockchain
 */
export interface SendTransactionIntentRequest extends BaseIntentRequest {
    /** Intent method */
    m: 'txIntent';
    /** Valid until (unix timestamp) */
    vu?: number;
    /** Target network ("-239" for mainnet, "-3" for testnet) */
    n?: string;
    /** Ordered list of intent items */
    i: IntentItem[];
}

/**
 * Sign Message Intent request
 * Signs the message but does NOT send to blockchain
 * Returns the signed BoC for gasless transactions
 */
export interface SignMessageIntentRequest extends BaseIntentRequest {
    /** Intent method */
    m: 'signMsg';
    /** Valid until (unix timestamp) */
    vu?: number;
    /** Target network ("-239" for mainnet, "-3" for testnet) */
    n?: string;
    /** Ordered list of intent items */
    i: IntentItem[];
}

/**
 * Sign Data Intent request
 */
export interface SignDataIntentRequest extends BaseIntentRequest {
    /** Intent method */
    m: 'signIntent';
    /** Target network */
    n?: string;
    /** Manifest URL for domain binding (optional if c.manifestUrl is present) */
    mu?: string;
    /** Sign data payload (text, binary, or cell) */
    p: SignDataIntentPayload;
}

/**
 * Send Action Intent request
 * Fetches action details from a URL
 */
export interface SendActionIntentRequest extends BaseIntentRequest {
    /** Intent method */
    m: 'actionIntent';
    /** Action URL that wallet will call to get action details */
    a: string;
}

/**
 * Union type for all intent requests
 */
export type IntentRequest =
    | SendTransactionIntentRequest
    | SignMessageIntentRequest
    | SignDataIntentRequest
    | SendActionIntentRequest;

/**
 * Intent method types
 */
export type IntentMethod = 'txIntent' | 'signMsg' | 'signIntent' | 'actionIntent';

// ============================================================================
// Intent Response Types
// ============================================================================

/**
 * Success response for transaction/signMessage intents
 */
export interface IntentTransactionResponseSuccess {
    /** Signed message BoC (base64 encoded) */
    result: string;
    id: string;
}

/**
 * Error response for intents
 */
export interface IntentResponseError {
    error: {
        code: number;
        message: string;
    };
    id: string;
}

/**
 * Success response for sign data intent
 * Matches spec: SignDataResponseSuccess
 */
export interface IntentSignDataResponseSuccess {
    result: {
        /** Base64 encoded signature */
        signature: string;
        /** Wallet address in raw format (0:hex) */
        address: string;
        /** UNIX timestamp in seconds (UTC) */
        timestamp: number;
        /** App domain name (as url part, without encoding) */
        domain: string;
        /** Payload from the request */
        payload: SignDataIntentPayload;
    };
    id: string;
}

/**
 * Union type for intent responses
 */
export type IntentResponse = IntentTransactionResponseSuccess | IntentSignDataResponseSuccess | IntentResponseError;

// ============================================================================
// Parsed Intent URL
// ============================================================================

/**
 * Parsed intent URL parameters
 */
export interface ParsedIntentUrl {
    /** Client public key (hex) */
    clientId: string;
    /** Intent request payload */
    request: IntentRequest;
}

// ============================================================================
// Intent Request Events (for wallet UI)
// ============================================================================

/**
 * Base intent event with common fields
 */
export interface BaseIntentEvent {
    /** Unique event ID */
    id: string;
    /** Client public key */
    clientId: string;
    /** Whether a connect flow should follow */
    hasConnectRequest: boolean;
    /** The raw connect request if present */
    connectRequest?: ConnectRequest;
}

/**
 * Transaction/SignMessage intent event for wallet UI
 */
export interface TransactionIntentEvent extends BaseIntentEvent {
    /** Intent type */
    type: 'txIntent' | 'signMsg';
    /** Network chain ID */
    network?: string;
    /** Valid until timestamp */
    validUntil?: number;
    /** Intent items to display */
    items: IntentItem[];
}

/**
 * Sign data intent event for wallet UI
 */
export interface SignDataIntentEvent extends BaseIntentEvent {
    /** Intent type */
    type: 'signIntent';
    /** Network chain ID */
    network?: string;
    /** Manifest URL */
    manifestUrl: string;
    /** Sign data payload */
    payload: SignDataIntentPayload;
}

/**
 * Action intent event for wallet UI
 */
export interface ActionIntentEvent extends BaseIntentEvent {
    /** Intent type */
    type: 'actionIntent';
    /** Action URL */
    actionUrl: string;
}

/**
 * Union type for all intent events
 */
export type IntentEvent = TransactionIntentEvent | SignDataIntentEvent | ActionIntentEvent;

// ============================================================================
// Action URL Response Types (for actionIntent)
// ============================================================================

/**
 * Message structure for sendTransaction action
 */
export interface ActionTransactionMessage {
    address: string;
    amount: string;
    payload?: string;
    stateInit?: string;
    extra_currency?: Record<number, string>;
}

/**
 * Send transaction action details
 */
export interface SendTransactionAction {
    valid_until?: number;
    network?: string;
    from?: string;
    messages: ActionTransactionMessage[];
}

/**
 * Sign data action (uses same payload types as signIntent)
 */
export type SignDataAction = SignDataIntentPayload & {
    network?: string;
    from?: string;
};

/**
 * Response from action URL
 */
export interface ActionUrlResponse {
    action_type: 'sendTransaction' | 'signData';
    action: SendTransactionAction | SignDataAction;
}
