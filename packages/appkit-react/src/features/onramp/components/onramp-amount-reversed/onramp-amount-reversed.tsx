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

export interface OnrampAmountReversedProps extends Omit<AmountReversedProps, 'onChangeDirection'> {
    onChangeDirection: () => void;
}

export const OnrampAmountReversed: FC<OnrampAmountReversedProps> = (props) => (
    <AmountReversed {...props} decimals={2} />
);
