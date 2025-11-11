/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Timeout constants for bridge operations
 */

/**
 * Default timeout for bridge requests (300 seconds)
 */
export const DEFAULT_REQUEST_TIMEOUT = 300000;

/**
 * Timeout for restoreConnection requests (10 seconds)
 * Shorter because this is called frequently on page load
 */
export const RESTORE_CONNECTION_TIMEOUT = 10000;

/**
 * Supported TonConnect protocol version
 */
export const SUPPORTED_PROTOCOL_VERSION = 2;
