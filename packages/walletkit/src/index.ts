// Main exports for TonWalletKit

export { TonWalletKit } from './core/TonWalletKitMinimal';

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

// Re-export logger for customization
export { Logger, LogLevel, createLogger, logger } from './core/Logger';
export type { LoggerConfig, LogContext } from './core/Logger';

// Re-export handlers for customization
export { ConnectHandler } from './handlers/ConnectHandler';
export { TransactionHandler } from './handlers/TransactionHandler';
export { SignDataHandler } from './handlers/SignDataHandler';
export { DisconnectHandler } from './handlers/DisconnectHandler';

// Re-export wallet contracts and initializers
export { WalletV5, WalletV5Config, WalletId, Opcodes } from './contracts/w5/WalletV5R1';
export { WalletV5R1CodeCell, WalletV5R1CodeBoc } from './contracts/w5/WalletV5R1.source';
export { WalletV5R1Adapter } from './contracts/w5/WalletV5R1Adapter';
export { createWalletV5R1 } from './contracts/w5/WalletV5R1Adapter';
