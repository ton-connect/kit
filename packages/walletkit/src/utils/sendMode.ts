/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendMode } from '../api/models/core/SendMode';
import { SendModeBase, SendModeFlag } from '../api/models/core/SendMode';

export function SendModeFromValue(value: number): SendMode {
    let base: SendModeBase;

    if (value & SendModeBase.CARRY_ALL_REMAINING_BALANCE) {
        base = SendModeBase.CARRY_ALL_REMAINING_BALANCE;
    } else if (value & SendModeBase.CARRY_ALL_REMAINING_INCOMING_VALUE) {
        base = SendModeBase.CARRY_ALL_REMAINING_INCOMING_VALUE;
    } else {
        base = SendModeBase.ORDINARY;
    }

    const flags: SendModeFlag[] = [];

    if (value & SendModeFlag.DESTROY_ACCOUNT_IF_ZERO) {
        flags.push(SendModeFlag.DESTROY_ACCOUNT_IF_ZERO);
    }
    if (value & SendModeFlag.BOUNCE_IF_FAILURE) {
        flags.push(SendModeFlag.BOUNCE_IF_FAILURE);
    }
    if (value & SendModeFlag.IGNORE_ERRORS) {
        flags.push(SendModeFlag.IGNORE_ERRORS);
    }
    if (value & SendModeFlag.PAY_GAS_SEPARATELY) {
        flags.push(SendModeFlag.PAY_GAS_SEPARATELY);
    }

    return { base, flags };
}

// Extension to combine base and flags into a single integer value
export function SendModeToValue(sendMode: SendMode): number {
    let value = sendMode.base ?? SendModeBase.ORDINARY;

    for (const flag of sendMode.flags) {
        value |= flag;
    }
    return value;
}
