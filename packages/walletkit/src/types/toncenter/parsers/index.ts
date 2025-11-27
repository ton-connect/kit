/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Public API for message parsing with extensible architecture
 */

// Core modules
export * from './opcodes';
export * from './messageDecoder';
export * from './messageHandler';

// Handlers
export { JettonTransferHandler, JettonInternalTransferHandler } from './handlers/JettonHandler';

// Legacy exports for backwards compatibility
export { getDecoded, extractOpFromBody, matchOpWithMap } from './body';
