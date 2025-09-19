// Main exports for TonWalletKit

export { SEND_TRANSACTION_ERROR_CODES } from '@tonconnect/protocol';
export { CHAIN } from '@tonconnect/protocol';

export { TonWalletKit } from './core/TonWalletKit';

// Re-export all types for convenience
export * from './types';
export * from './types/internal';

// Re-export error handling system
export * from './errors';

// Re-export managers for advanced customization
export { WalletManager } from './core/WalletManager';
export { SessionManager } from './core/SessionManager';
export { BridgeManager } from './core/BridgeManager';
export { EventRouter } from './core/EventRouter';
export { RequestProcessor } from './core/RequestProcessor';
export { Initializer } from './core/Initializer';
export { JettonsManager } from './core/JettonsManager';
export { EventEmitter } from './core/EventEmitter';
export type { EventListener } from './core/EventEmitter';
export { ApiClientToncenter } from './core/ApiClientToncenter';

// Re-export durable events components
export { StorageEventStore } from './core/EventStore';
export { StorageEventProcessor } from './core/EventProcessor';

// Re-export handlers for customization
export { ConnectHandler } from './handlers/ConnectHandler';
export { TransactionHandler } from './handlers/TransactionHandler';
export { SignDataHandler } from './handlers/SignDataHandler';
export { DisconnectHandler } from './handlers/DisconnectHandler';

// Re-export wallet contracts and initializers
export { WalletV5, WalletId, Opcodes } from './contracts/w5/WalletV5R1';
export type { WalletV5Config } from './contracts/w5/WalletV5R1';
export { WalletV5R1CodeCell, WalletV5R1CodeBoc } from './contracts/w5/WalletV5R1.source';
export { WalletV5R1Adapter } from './contracts/w5/WalletV5R1Adapter';
export { createWalletV5R1 } from './contracts/w5/WalletV5R1Adapter';
export { defaultWalletIdV5R1 } from './contracts/w5/WalletV5R1Adapter';

export { LocalStorageAdapter } from './storage/adapters/local';
export { MemoryStorageAdapter } from './storage/adapters/memory';
export { ExtensionStorageAdapter } from './storage/adapters/extension';

export type { ApiClient } from './types/toncenter/ApiClient';

export { formatWalletAddress } from './utils/address';
export { CallForSuccess } from './utils/retry';
export {
    Base64Normalize,
    ParseBase64,
    Base64ToHash,
    Base64ToUint8Array,
    Uint8ArrayToBase64,
    Base64ToBigInt,
    BigIntToBase64,
    Uint8ArrayToBigInt,
} from './utils/base64';

export { PrepareSignDataResult } from './utils/signData/sign';

export { Hash } from './types/primitive';
export { TonProofParsedMessage } from './utils/tonProof';

// Re-export JS Bridge components
export type {
    JSBridgeInjectOptions,
    TonConnectBridge,
    DeviceInfo,
    WalletInfo,
    ConnectRequest,
    ConnectEvent,
    ConnectEventError,
    InjectedToExtensionBridgeRequest,
    BridgeResponse,
    BridgeEvent,
    BridgeEventMessageInfo,
    AppRequest,
    WalletResponse,
    WalletEvent,
    DisconnectEvent,
    ConnectItem,
    ConnectItemReply,
    Feature,
} from './types/jsBridge';

// Re-export validation utilities
export { validateWalletName, sanitizeWalletName, isValidWalletName } from './utils/walletNameValidation';
export { MnemonicToKeyPair } from './utils/mnemonic';
export { DefaultSignature, FakeSignature } from './utils/sign';
