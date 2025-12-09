/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ExtraCurrencies } from "../models/core/ExtraCurrencies";
import { Mapper } from "./Mapper";

/**
 * Maps internal Record<number, string> to API ExtraCurrencies model.
 * Since ExtraCurrencies is Record<string, TokenAmount>, we return directly.
 */
export class ExtraCurrenciesMapper extends Mapper<
  Record<number, string>,
  ExtraCurrencies
> {
  map(input: Record<number, string>): ExtraCurrencies {
    // ExtraCurrencies accepts number keys via index signature
    return input;
  }
}
