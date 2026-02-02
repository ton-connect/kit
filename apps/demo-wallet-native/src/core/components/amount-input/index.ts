/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BalancePercents } from './balance-percents';
import { InputContainer } from './container';
import { InputHeader } from './header';
import { InputWithFiat } from './input-with-fiat';
import { InputWithTicker } from './input-with-ticker';

export const AmountInput = {
    Header: InputHeader,
    Container: InputContainer,
    WithFiat: InputWithFiat,
    WithTicker: InputWithTicker,
    Percents: BalancePercents,
};
