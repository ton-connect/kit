/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Information about a decentralized application (dApp) connecting via TON Connect.
 */
export interface DAppInfo {
  /**
   * Display name of the dApp
   */
  name?: string;

  /**
   * Brief description of the dApp's purpose
   */
  description?: string;

  /**
   * Main website URL of the dApp
   * @format url
   */
  url?: string;

  /**
   * Icon/logo URL of the dApp
   * @format url
   */
  iconUrl?: string;
}
