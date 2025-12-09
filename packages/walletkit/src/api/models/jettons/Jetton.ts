/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { UserFriendlyAddress } from "../core/Primitives";
import { TokenAmount } from "../core/TokenAmount";
import { TokenInfo } from "../core/TokenInfo";

/**
 * Jetton fungible token on the TON blockchain (TEP-74 standard).
 */
export interface Jetton {
  /**
   * The Jetton contract address
   */
  address: UserFriendlyAddress;

  /**
   * The Jetton wallet address
   */
  walletAddress?: UserFriendlyAddress;

  /**
   * The current jetton balance
   */
  balance?: TokenAmount;

  /**
   * Information about the token
   */
  info?: TokenInfo;

  /**
   * The number of decimal places used by the token
   * @format int
   */
  decimalsNumber?: number;

  /**
   * Additional arbitrary data related to the jetton
   */
  extra?: { [key: string]: unknown };
}
