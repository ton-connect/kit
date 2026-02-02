/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Type exports for @ton/mcp package
 */

// Storage adapter
export type { IStorageAdapter } from './storage.js';

// Signer adapter
export type { ISignerAdapter, WalletInfo, CreateWalletParams, ImportWalletParams } from './signer.js';

// User context provider
export type { IUserContextProvider, RequestContext } from './user-context.js';

// Contact resolver
export type { IContactResolver, Contact } from './contacts.js';

// Config
export type { TonMcpConfig, LimitsConfig } from './config.js';
