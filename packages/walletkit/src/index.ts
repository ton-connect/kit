/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { SEND_TRANSACTION_ERROR_CODES } from '@tonconnect/protocol';
export { TonWalletKit } from './core/TonWalletKit';
export * from './types';
export type * from './types/internal';
export * from './errors';
export { WalletManager } from './core/WalletManager';
export { TONConnectStoredSessionManager } from './core/TONConnectStoredSessionManager';
export type { TONConnectSessionManager } from './api/interfaces/TONConnectSessionManager';
export { BridgeManager } from './core/BridgeManager';
export { EventRouter } from './core/EventRouter';
export { RequestProcessor } from './core/RequestProcessor';
export { Initializer } from './core/Initializer';
export { JettonsManager } from './core/JettonsManager';
export { SwapManager, SwapProvider, SwapError } from './defi/swap';
export { EventEmitter } from './core/EventEmitter';
export type { EventListener } from './core/EventEmitter';
export { ApiClientToncenter } from './clients/toncenter';
export { ApiClientTonApi } from './clients/tonapi';
export type { NetworkManager } from './core/NetworkManager';
export { KitNetworkManager } from './core/NetworkManager';
export { StorageEventStore } from './core/EventStore';
export { StorageEventProcessor } from './core/EventProcessor';
export { ConnectHandler } from './handlers/ConnectHandler';
export { TransactionHandler } from './handlers/TransactionHandler';
export { SignDataHandler } from './handlers/SignDataHandler';
export { DisconnectHandler } from './handlers/DisconnectHandler';
export { WalletV5, WalletV5R1Id, Opcodes } from './contracts/w5/WalletV5R1';
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
export { Storage } from './storage/Storage';
export type { ApiClient } from './types/toncenter/ApiClient';
export { formatWalletAddress } from './utils/address';
export { CallForSuccess } from './utils/retry';
export { createWalletId } from './utils/walletId';
export type { WalletId } from './utils/walletId';
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
export { TonProofParsedMessage } from './utils/tonProof';
export type { ITonWalletKit } from './types/kit';
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
export { MnemonicToKeyPair, CreateTonMnemonic } from './utils/mnemonic';
export { DefaultSignature, FakeSignature } from './utils/sign';
export { wrapWalletInterface } from './core/Initializer';
export type { NftTransferParamsHuman, NftTransferParamsRaw } from './types/nfts';

export { isValidAddress } from './utils/address';
export { validateTransactionMessage } from './validation';
export { createDeviceInfo, createWalletManifest, getMaxOutgoingMessages } from './utils/getDefaultWalletConfig';
export { Signer } from './utils/Signer';
export { ParseStack, SerializeStack } from './utils/tvmStack';
export { Transport } from './bridge/transport/Transport';
export { TONCONNECT_BRIDGE_EVENT } from './bridge/utils/messageTypes';
export { RESTORE_CONNECTION_TIMEOUT, DEFAULT_REQUEST_TIMEOUT } from './bridge/utils/timeouts';
export { CreateTonProofMessageBytes } from './utils/tonProof';
export type { AnalyticsAppInfo, AnalyticsManagerOptions } from './analytics';

// API Client types (ApiClient is exported above)
export type {
    TransactionsByAddressRequest,
    GetTransactionByHashRequest,
    GetPendingTransactionsRequest,
    GetTraceRequest,
    GetPendingTraceRequest,
    GetJettonsByOwnerRequest,
    GetJettonsByAddressRequest,
    GetEventsRequest,
    GetEventsResponse,
} from './types/toncenter/ApiClient';
export type { FullAccountState } from './types/toncenter/api';
export type { ToncenterEmulationResult } from './utils/toncenterEmulation';
export type { ToncenterResponseJettonMasters } from './types/toncenter/emulation';
export { asHex } from './utils/hex';
export {
    // Message builders
    storeJettonTransferMessage,
    storeNftTransferMessage,
    createJettonTransferPayload,
    createNftTransferPayload,
    createNftTransferRawPayload,
    createCommentPayload,
    createCommentPayloadBase64,
    createTransferTransaction,
    // Constants
    DEFAULT_JETTON_GAS_FEE,
    DEFAULT_NFT_GAS_FEE,
    DEFAULT_FORWARD_AMOUNT,
} from './utils/messageBuilders';
export type {
    JettonTransferMessage,
    NftTransferMessage,
    NftTransferRawParams,
    CreateTransferTransactionParams,
} from './utils/messageBuilders';

// Asset helpers
export {
    getJettonWalletAddressFromClient,
    getJettonBalanceFromClient,
    getJettonsFromClient,
    getNftsFromClient,
    getNftFromClient,
} from './utils/assetHelpers';

export { formatUnits, parseUnits } from './utils/units';

// API Interfaces
export type * from './api/interfaces';
export * from './api/models';
