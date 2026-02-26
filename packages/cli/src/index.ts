/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * @ton/cli - Agent-friendly CLI for TON blockchain wallet operations
 *
 * This module provides the CliWalletService and utilities for
 * programmatic usage of the TON CLI functionality.
 */

export { CliWalletService } from './services/CliWalletService.js';
export type {
    CliWalletServiceConfig,
    JettonInfoResult,
    NftInfoResult,
    TransactionInfo,
    TransferResult,
    SwapQuoteResult,
} from './services/CliWalletService.js';

export type { IContactResolver, Contact, TonCliConfig, NetworkConfig } from './types/index.js';

export { resolveCredentials, loadConfig, saveConfig, deleteConfig } from './utils/config.js';
export type { TonConfig, ResolvedCredentials } from './utils/config.js';

export { KNOWN_JETTONS } from './commands/jettons.js';
