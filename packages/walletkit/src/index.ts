// Main exports for TonWalletKit

export { TonWalletKit } from './core/TonWalletKit';

// Re-export all types for convenience
export * from './types';
export * from './types/internal';

// Re-export managers for advanced customization
export { WalletManager } from './core/WalletManager';
export { SessionManager } from './core/SessionManager';
export { BridgeManager } from './core/BridgeManager';
export { EventRouter } from './core/EventRouter';
export { RequestProcessor } from './core/RequestProcessor';
export { ResponseHandler } from './core/ResponseHandler';
export { Initializer } from './core/Initializer';
export { JettonsManager } from './core/JettonsManager';
export { EventEmitter } from './core/EventEmitter';
export type { EventListener } from './core/EventEmitter';

// Re-export durable events components
export { StorageEventStore } from './core/EventStore';
export { StorageEventProcessor } from './core/EventProcessor';

// Re-export logger for customization
export { Logger, LogLevel, createLogger, createReactNativeLogger } from './core/Logger';
export type { LoggerConfig, LogContext, PerformanceData } from './core/Logger';

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

// Re-export JS Bridge components
export { JSBridgeManager, type JSBridgeManagerOptions } from './bridge/JSBridgeManager';
export { JSBridgeMessageHandler } from './bridge/JSBridgeMessageHandler';
export type {
    JSBridgeInjectOptions,
    TonConnectBridge,
    DeviceInfo,
    WalletInfo,
    ConnectRequest,
    ConnectEvent,
    ConnectEventError,
    BridgeRequest,
    BridgeResponse,
    BridgeEvent,
} from './types/jsBridge';

// Re-export validation utilities
export { validateWalletName, sanitizeWalletName, isValidWalletName } from './utils/walletNameValidation';

// Re-export React Native debugging utilities
export {
    isReactNative,
    isDevelopment,
    logReactNativeError,
    ReactNativePerformanceMonitor,
    ReactNativeDebugInfo,
    globalPerformanceMonitor,
    globalDebugInfo,
    reactNativeLog,
    initializeReactNativeDebugging,
    exportDebugReport,
} from './utils/reactNativeDebug';
