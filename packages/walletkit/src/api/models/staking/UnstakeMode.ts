/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const UNSTAKE_MODE_INSTANT = 'INSTANT'; // instant - withdraw immediately, if liquidity is not available, the funds will be returned to the user
export const UNSTAKE_MODE_WHEN_AVAILABLE = 'WHEN_AVAILABLE'; // when_available - withdraw when liquidity is available(instant, or round_end)
export const UNSTAKE_MODE_ROUND_END = 'ROUND_END'; // round_end - withdraw at the end of the round for best rate(~18 hours)

export const UnstakeMode = {
    INSTANT: UNSTAKE_MODE_INSTANT,
    WHEN_AVAILABLE: UNSTAKE_MODE_WHEN_AVAILABLE,
    ROUND_END: UNSTAKE_MODE_ROUND_END,
} as const;

/**
 * Mode of unstaking
 */
export type UnstakeModes = (typeof UnstakeMode)[keyof typeof UnstakeMode];
