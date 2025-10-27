/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
export { defaultWalletIdV5R1 } from './contracts/w5/WalletV5R1Adapter';

export { WalletV4R2 } from './contracts/v4r2/WalletV4R2';
export type { WalletV4R2Config } from './contracts/v4r2/WalletV4R2';
export { WalletV4R2CodeCell } from './contracts/v4r2/WalletV4R2.source';
export { WalletV4R2Adapter } from './contracts/v4r2/WalletV4R2Adapter';
export { defaultWalletIdV4R2 } from './contracts/v4r2/constants';

export { LocalStorageAdapter } from './storage/adapters/local';
export { MemoryStorageAdapter } from './storage/adapters/memory';
export { ExtensionStorageAdapter } from './storage/adapters/extension';

export type { ApiClient } from './types/toncenter/ApiClient';

export type { MoneyFlow, MoneyFlowSelf, MoneyFlowRow } from './utils/toncenterEmulation';

export { formatWalletAddress } from './utils/address';
export { CallForSuccess } from './utils/retry';
export {
    Base64Normalize,
    Base64NormalizeUrl,
    ParseBase64,
    Base64ToHex,
    Base64ToUint8Array,
    Uint8ArrayToBase64,
    Base64ToBigInt,
    BigIntToBase64,
    Uint8ArrayToBigInt,
    HexToBigInt,
    HexToBase64,
    Uint8ArrayToHex,
    HexToUint8Array,
} from './utils/base64';

export type { ToncenterTransaction } from './types/toncenter/emulation';

export { PrepareSignDataResult } from './utils/signData/sign';

export { Hex } from './types/primitive';
export { TonProofParsedMessage } from './utils/tonProof';
export type { ITonWalletKit } from './types/kit';

// Re-export JS Bridge components
export type {
    JSBridgeInjectOptions,
    JSBridgeTransportFunction,
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
    InjectedToExtensionBridgeRequestPayload,
} from './types/jsBridge';

// Re-export validation utilities
export { validateWalletName, sanitizeWalletName, isValidWalletName } from './utils/walletNameValidation';
export { MnemonicToKeyPair, CreateTonMnemonic } from './utils/mnemonic';
export { DefaultSignature, FakeSignature } from './utils/sign';

export { wrapWalletInterface } from './core/Initializer';
export { createDeviceInfo, createWalletManifest } from './utils/getDefaultWalletConfig';

export { Signer } from './utils/Signer';

export { ParseStack, SerializeStack } from './utils/tvmStack';
