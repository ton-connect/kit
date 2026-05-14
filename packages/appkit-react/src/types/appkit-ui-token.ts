/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/appkit';

/**
 * UI-side token descriptor consumed by appkit-react widgets ({@link SwapWidget}, {@link SwapField}, currency selectors, etc.) — identifies the token in the picker UI and carries display + on-chain fields the widget needs to render and quote.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface AppkitUIToken {
    /** Stable id used for picker selection state and section grouping. */
    id: string;
    /** Ticker symbol shown in the picker and selector chip (e.g., `"TON"`, `"USDT"`). */
    symbol: string;
    /** Full token name shown in the picker (e.g., `"Toncoin"`). */
    name: string;
    /** Number of decimal places used to format raw amounts. */
    decimals: number;
    /** Token contract address. Pass `'ton'` for native TON; otherwise the jetton master's user-friendly address. */
    address: string;
    /** Optional URL of the token logo shown in the picker and selector chip. */
    logo?: string;
    /** Optional fiat exchange rate (`1 token = rate fiat units`). Used by widgets to render fiat conversions next to amounts. */
    rate?: string;
    /** {@link appkit:Network} the token lives on. Widgets filter their token universe by the active network. */
    network: Network;
}
