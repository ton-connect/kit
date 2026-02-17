/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { FC, ComponentProps } from 'react';
export interface CurrencyItemProps extends ComponentProps<'button'> {
    ticker: string;
    name?: string;
    balance?: string;
    icon?: string;
    isVerified?: boolean;
}
export declare const CurrencyItem: FC<CurrencyItemProps>;
//# sourceMappingURL=currency-item.d.ts.map