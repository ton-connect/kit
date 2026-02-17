/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetSwapQuoteData, GetSwapQuoteErrorType, GetSwapQuoteQueryConfig } from '@ton/appkit/queries';
import type { UseQueryReturnType } from '../../../libs/query';
export type UseSwapQuoteParameters<selectData = GetSwapQuoteData> = GetSwapQuoteQueryConfig<selectData>;
export type UseSwapQuoteReturnType<selectData = GetSwapQuoteData> = UseQueryReturnType<selectData, GetSwapQuoteErrorType>;
export declare const useSwapQuote: <selectData = GetSwapQuoteData>(parameters?: UseSwapQuoteParameters<selectData>) => UseSwapQuoteReturnType<selectData>;
//# sourceMappingURL=use-swap-quote.d.ts.map