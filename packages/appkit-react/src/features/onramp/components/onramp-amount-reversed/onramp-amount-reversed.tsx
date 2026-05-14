/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { AmountReversed } from '../../../../components/ui/amount-reversed';
import type { AmountReversedProps } from '../../../../components/ui/amount-reversed';

/**
 * Props for `OnrampAmountReversed` — same as `AmountReversed` but with a required `onChangeDirection`. Internal: fiat onramp is not part of the public API yet.
 */
export interface OnrampAmountReversedProps extends Omit<AmountReversedProps, 'onChangeDirection'> {
    /** Callback fired when the user toggles between token-amount and fiat-amount input. */
    onChangeDirection: () => void;
}

/**
 * Thin wrapper around `AmountReversed` that fixes `decimals` to `2` — used to render the fiat-side companion value in fiat onramp widgets. Internal: fiat onramp is not part of the public API yet.
 */
export const OnrampAmountReversed: FC<OnrampAmountReversedProps> = (props) => (
    <AmountReversed {...props} decimals={2} />
);
