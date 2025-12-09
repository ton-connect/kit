/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Hex } from "../core/Primitives";

/**
 * Response after user approves a sign data request.
 */
export interface SignDataApprovalResponse {
  /**
   * Cryptographic signature of the signed data in hexadecimal format
   */
  signature: Hex;
}
