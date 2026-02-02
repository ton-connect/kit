/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * This mode determines how the message is sent, including whether to pay for gas separately and how to handle errors.
 */
export interface SendMode {
    base?: SendModeBase;
    flags: SendModeFlag[];
}

/**
 * @format int
 */
export enum SendModeBase {
    /**
     * Ordinary message
     */
    ORDINARY = 0,
    /**
     * Carry all the remaining value of the inbound message in addition to the value initially indicated in the new message
     */
    CARRY_ALL_REMAINING_INCOMING_VALUE = 64,
    /**
     * Carry all the remaining balance of the current smart contract instead of the value originally indicated in the message
     */
    CARRY_ALL_REMAINING_BALANCE = 128,
}

/**
 * @format int
 */
export enum SendModeFlag {
    /**
     * Destroy the current account if its resulting balance is zero (often used with Mode 128)
     */
    DESTROY_ACCOUNT_IF_ZERO = 32,
    /**
     * In the case of action failure, bounce the transaction. No effect if +2 is used.
     */
    BOUNCE_IF_FAILURE = 16,
    /**
     * Ignore some errors arising while processing this message during the action phase
     */
    IGNORE_ERRORS = 2,
    /**
     * Pay transfer fees separately from the message value
     */
    PAY_GAS_SEPARATELY = 1,
}
