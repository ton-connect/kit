/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Types of assets supported on the TON blockchain.
 */
export enum AssetType {
  /**
   * Native TON cryptocurrency
   */
  ton = "ton",
  /**
   * Jetton fungible token (TEP-74 standard)
   */
  jetton = "jetton",
  /**
   * Non-fungible token (TEP-62 standard)
   */
  nft = "nft",
}
