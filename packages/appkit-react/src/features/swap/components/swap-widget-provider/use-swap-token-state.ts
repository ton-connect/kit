/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import { validateNumericString } from '@ton/appkit';

import type { SwapWidgetToken } from './swap-widget-provider';
import { truncateDecimals } from '../../utils/truncate-decimals';

interface UseSwapTokenStateOptions {
    mappedTokens: SwapWidgetToken[];
    defaultFromSymbol?: string;
    defaultToSymbol?: string;
}

export function useSwapTokenState({ mappedTokens, defaultFromSymbol, defaultToSymbol }: UseSwapTokenStateOptions) {
    const [fromToken, setFromToken] = useState<SwapWidgetToken | null>(
        mappedTokens.find((t) => t.symbol.toLowerCase() === defaultFromSymbol?.toLowerCase()) ??
            mappedTokens[0] ??
            null,
    );
    const [toToken, setToToken] = useState<SwapWidgetToken | null>(
        mappedTokens.find((t) => t.symbol.toLowerCase() === defaultToSymbol?.toLowerCase()) ?? mappedTokens[1] ?? null,
    );
    const [fromAmount, setFromAmountRaw] = useState('');

    const setFromAmount = useCallback(
        (value: string) => {
            if (value === '' || validateNumericString(value, fromToken?.decimals)) {
                setFromAmountRaw(value);
            }
        },
        [fromToken?.decimals],
    );

    const handleSetFromToken = useCallback(
        (token: SwapWidgetToken) => {
            if (toToken && token.address === toToken.address) {
                setToToken(fromToken);
            }
            setFromToken(token);
            setFromAmountRaw((prev) => truncateDecimals(prev, token.decimals));
        },
        [fromToken, toToken],
    );

    const handleSetToToken = useCallback(
        (token: SwapWidgetToken) => {
            if (fromToken && token.address === fromToken.address) {
                setFromToken(toToken);
            }
            setToToken(token);
        },
        [fromToken, toToken],
    );

    const onFlip = useCallback(() => {
        setFromToken(toToken);
        setToToken(fromToken);
        if (toToken) {
            setFromAmountRaw((prev) => truncateDecimals(prev, toToken.decimals));
        }
    }, [fromToken, toToken]);

    return {
        fromToken,
        toToken,
        fromAmount,
        setFromToken: handleSetFromToken,
        setToToken: handleSetToToken,
        setFromAmount,
        onFlip,
    };
}
