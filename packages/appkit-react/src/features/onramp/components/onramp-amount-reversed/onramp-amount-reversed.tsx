/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { AmountReversed } from '../../../../components/amount-reversed';
import type { AmountReversedProps } from '../../../../components/amount-reversed';

export type OnrampAmountReversedProps = AmountReversedProps;

export const OnrampAmountReversed: FC<OnrampAmountReversedProps> = ({ decimals, ...props }) => (
    <AmountReversed {...props} decimals={decimals ?? 2} />
);
