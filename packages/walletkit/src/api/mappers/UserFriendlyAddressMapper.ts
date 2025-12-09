/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from "@ton/core";

import type { UserFriendlyAddress } from "../models/core/Primitives";
import { Mapper } from "./Mapper";

/**
 * Maps internal address string to API UserFriendlyAddress model.
 * Uses @ton/core Address for conversion.
 * Returns undefined if mapping fails.
 */
export class UserFriendlyAddressMapper extends Mapper<
  string,
  UserFriendlyAddress | undefined
> {
  map(input: string): UserFriendlyAddress | undefined {
    try {
      return Address.parse(input).toString();
    } catch {
      // If parsing fails, return undefined
      return undefined;
    }
  }
}
