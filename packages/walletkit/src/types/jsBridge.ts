// Types for TonConnect JS Bridge implementation

type Feature =
    | {
          name: 'SendTransaction';
          maxMessages: number; // maximum number of messages in one `SendTransaction` that the wallet supports
          extraCurrencySupported?: boolean; // indicates if the wallet supports extra currencies
      }
    | {
          name: 'SignData';
          types: ('text' | 'binary' | 'cell')[]; // array of supported data types for signing
      };

export interface DeviceInfo {
    platform: 'web' | 'ios' | 'android' | 'desktop';
    appName: string;
    appVersion: string;
    maxProtocolVersion: number;
    features: Feature[];
}

export interface WalletInfo {
    name: string;
    image: string;
    tondns?: string;
    about_url: string;
}

export interface ConnectRequest {
    manifestUrl: string;
    items: ConnectItem[];
}

export interface ConnectItem {
    name: string;
    [key: string]: unknown;
}

export interface ConnectEvent {
    event: 'connect';
    id: number;
    payload: {
        items: ConnectItemReply[];
        device: DeviceInfo;
    };
}

export interface ConnectEventError {
    event: 'connect_error';
    id: number;
    payload: {
        code: number;
        message: string;
    };
}

export interface ConnectItemReply {
    name: string;
    [key: string]: unknown;
}

export interface DisconnectEvent {
    event: 'disconnect';
    id: number;
    payload: Record<string, never>;
}

export interface AppRequest {
    method: string;
    params: unknown[];
    id: string;
}

export interface WalletResponse {
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
    id: string;
}

export type WalletEvent = DisconnectEvent;

/**
 * TonConnect JS Bridge interface as specified in the TON Connect documentation
 * @see https://github.com/ton-blockchain/ton-connect/blob/main/bridge.md#js-bridge
 */
export interface TonConnectBridge {
    deviceInfo: DeviceInfo;
    walletInfo?: WalletInfo;
    protocolVersion: number;
    isWalletBrowser: boolean;

    connect(protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent>;
    restoreConnection(): Promise<ConnectEvent | ConnectEventError>;
    send(message: AppRequest): Promise<WalletResponse>;
    listen(callback: (event: WalletEvent) => void): () => void;
}

/**
 * Options for JS Bridge injection
 */
export interface JSBridgeInjectOptions {
    walletName: string;
    deviceInfo?: Partial<DeviceInfo>;
    walletInfo?: WalletInfo;
}

/**
 * Internal message types for communication between injected bridge and extension
 */
export interface BridgeRequest {
    type: 'TONCONNECT_BRIDGE_REQUEST';
    source: string;
    payload: BridgeRequestPayload;
    // method: 'connect' | 'restoreConnection' | 'send';
    // messageId: number;
    // params: {
    //     protocolVersion?: number;
    //     message?: ConnectRequest | AppRequest;
    // };
}

export interface BridgeRequestPayload {
    id: string;
    method: string;
    params: unknown;
    from?: string;
}

export interface BridgeResponse {
    type: 'TONCONNECT_BRIDGE_RESPONSE';
    source: string;
    messageId: number;
    success: boolean;
    result?: unknown;
    error?: string | { code: number; message: string };
}

export interface BridgeEvent {
    type: 'TONCONNECT_BRIDGE_EVENT';
    source: string;
    event: WalletEvent;
}
