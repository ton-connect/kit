/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import { validateNumericString, truncateDecimals } from '@ton/appkit';

import type { AppkitUIToken } from '../../../../types/appkit-ui-token';

interface UseSwapTokenStateOptions {
    mappedTokens: AppkitUIToken[];
    defaultFromSymbol?: string;
    defaultToSymbol?: string;
}

export function useSwapTokenState({ mappedTokens, defaultFromSymbol, defaultToSymbol }: UseSwapTokenStateOptions) {
    const [fromToken, setFromToken] = useState<AppkitUIToken | null>(
        mappedTokens.find((t) => t.symbol.toLowerCase() === defaultFromSymbol?.toLowerCase()) ??
            mappedTokens[0] ??
            null,
    );
    const [toToken, setToToken] = useState<AppkitUIToken | null>(
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
        (token: AppkitUIToken) => {
            if (toToken && token.address === toToken.address) {
                setToToken(fromToken);
            }
            setFromToken(token);
            setFromAmountRaw((prev) => truncateDecimals(prev, token.decimals));
        },
        [fromToken, toToken],
    );

    const handleSetToToken = useCallback(
        (token: AppkitUIToken) => {
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
