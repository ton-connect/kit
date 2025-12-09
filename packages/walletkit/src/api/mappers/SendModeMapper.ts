/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendMode } from "../models/core/SendMode";
import { SendModeBase, SendModeFlag } from "../models/core/SendMode";
import { Mapper } from "./Mapper";

/**
 * Maps number to API SendMode model and vice versa.
 * Decodes/encodes the send mode bits into base and flags.
 */
export class SendModeMapper extends Mapper<number, SendMode> {
  map(input: number): SendMode {
    const flags: SendModeFlag[] = [];

    // Extract flags
    if (input & SendModeFlag.DESTROY_ACCOUNT_IF_ZERO) {
      flags.push(SendModeFlag.DESTROY_ACCOUNT_IF_ZERO);
    }
    if (input & SendModeFlag.BOUNCE_IF_FAILURE) {
      flags.push(SendModeFlag.BOUNCE_IF_FAILURE);
    }
    if (input & SendModeFlag.IGNORE_ERRORS) {
      flags.push(SendModeFlag.IGNORE_ERRORS);
    }
    if (input & SendModeFlag.PAY_GAS_SEPARATELY) {
      flags.push(SendModeFlag.PAY_GAS_SEPARATELY);
    }

    // Extract base mode (128, 64, or 0)
    let base: SendModeBase = SendModeBase.ORDINARY;
    if (input & SendModeBase.CARRY_ALL_REMAINING_BALANCE) {
      base = SendModeBase.CARRY_ALL_REMAINING_BALANCE;
    } else if (input & SendModeBase.CARRY_ALL_REMAINING_INCOMING_VALUE) {
      base = SendModeBase.CARRY_ALL_REMAINING_INCOMING_VALUE;
    }

    return { base, flags };
  }

  /**
   * Reverse mapping: SendMode -> number
   */
  reverse(input: SendMode): number {
    let result = input.base as number;
    for (const flag of input.flags) {
      result |= flag as number;
    }
    return result;
  }
}
