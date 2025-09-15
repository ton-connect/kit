// Type definitions module exports

// Wallet types
export type {
    TonNetwork,
    WalletInterface,
    WalletMetadata,
    WalletStatus,
    WalletVersion,
    WalletInitConfig,
    TonTransferParams,
    TonTransferManyParams,
    TonTransferParamsBody,
    TonTransferParamsComment,
    WalletTonInterface,
    WalletJettonInterface,
    WalletNftInterface,
    WalletInitInterface,
    WalletInitConfigSignerInterface,
    WalletInitConfigMnemonicInterface,
    WalletInitConfigPrivateKeyInterface,
} from './wallet';

export {
    createWalletInitConfigMnemonic,
    createWalletInitConfigPrivateKey,
    createWalletInitConfigSigner,
    isWalletInitConfigMnemonic,
    isWalletInitConfigPrivateKey,
    isWalletInitConfigSigner,
} from './wallet';

// Transaction types (from validation module)
export type { HumanReadableTx } from '../validation/transaction';

// Event types
export type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    ConnectPreview,
    TransactionRequest,
    TransactionPreview,
    SignDataPreview,
} from './events';

// Configuration types
export type { TonWalletKitOptions } from './config';

// Main kit interface
export type { TonWalletKit, SessionInfo, KitStatus } from './kit';

// Internal types (re-export from internal.ts)
export type {
    SessionData,
    BridgeConfig,
    EventCallback,
    ValidationResult,
    RawBridgeEvent,
    EventType,
    EventHandler,
} from './internal';

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
    EmulationAddressBookEntry,
    EmulationAddressMetadata,
    EmulationTokenInfo,
    EmulationTokenInfoWallets,
    EmulationTokenInfoMasters,
} from './toncenter/emulation';

export type { NftItem } from './toncenter/NftItem';

export type { NftItems } from './toncenter/NftItems';
