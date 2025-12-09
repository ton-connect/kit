/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Jetton } from "./Jetton";

/**
 * Response containing a list of Jetton tokens.
 */
export interface JettonsResponse {
  /**
   * List of Jettons
   */
  jettons: Jetton[];
}
