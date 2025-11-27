/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Type definitions module exports

// Wallet types
export type {
    IWallet,
    WalletMetadata,
    WalletVersion,
    TonTransferParams,
    TonTransferManyParams,
    TonTransferParamsBody,
    TonTransferParamsComment,
    WalletTonInterface,
    WalletJettonInterface,
    WalletNftInterface,
    IWalletAdapter,
    WalletSigner,
} from './wallet';

// Transaction types (from validation module)
export type { HumanReadableTx } from '../validation/transaction';
export type { ValidationResult } from '../validation/types';

// Event types
export type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventTransactionApproval,
    EventSignDataApproval,
    EventDisconnect,
    EventRequestError,
    ConnectPreview,
    TransactionPreview,
    SignDataPreview,
} from './events';

// Configuration types
export type { TonWalletKitOptions } from './config';

// Main kit interface
export type { ITonWalletKit, SessionInfo } from './kit';

// Internal types (re-export from internal.ts)
export type { SessionData, BridgeConfig, EventCallback, RawBridgeEvent, EventType, EventHandler } from './internal';

// Durable events types
export type { EventStatus, StoredEvent, DurableEventsConfig, EventStore, EventProcessor } from './durableEvents';

export { DEFAULT_DURABLE_EVENTS_CONFIG } from './durableEvents';

// Jettons types
export type {
    JettonInfo,
    JettonVerification,
    AddressJetton,
    JettonBalance,
    JettonTransferParams,
    PreparedJettonTransfer,
    JettonTransfer,
    JettonTransaction,
    JettonTransactionDetails,
    JettonPrice,
    TransactionFees,
    JettonsAPI,
} from './jettons';

export { JettonError, JettonErrorCode } from './jettons';

// Toncenter types
export type {
    ToncenterEmulationResponse,
    ToncenterResponseJettonWallets,
    ToncenterJettonWallet,
    EmulationAddressMetadata,
    EmulationTokenInfo,
    EmulationTokenInfoWallets,
    EmulationTokenInfoMasters,
    ToncenterTracesResponse,
    ToncenterTraceItem,
    TraceMeta,
} from './toncenter/emulation';

export type { NftItem } from './toncenter/NftItem';

export type { NftItems } from './toncenter/NftItems';
export { emulationEvent } from './toncenter/AccountEvent';

// Account Event types
export type {
    Event,
    Action,
    TypedAction,
    TonTransferAction,
    TonTransfer,
    SmartContractExecAction,
    SmartContractExec,
    JettonSwapAction,
    JettonSwap,
    JettonTransferAction,
    NftItemTransferAction,
    ContractDeployAction,
    Account,
    SimplePreview,
    AddressBook,
    AddressBookItem,
    JettonMasterInfo,
    JettonWalletInfo,
    StatusAction,
    JettonMasterOut,
} from './toncenter/AccountEvent';
