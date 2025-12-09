/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from "../models/core/TokenAmount";
import { Mapper } from "./Mapper";

/**
 * Maps internal string to API TokenAmount model.
 */
export class TokenAmountMapper extends Mapper<string, TokenAmount> {
  map(input: string): TokenAmount {
    return input;
  }
}
