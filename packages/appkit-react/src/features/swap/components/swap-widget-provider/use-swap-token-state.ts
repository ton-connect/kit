/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useState } from 'react';
import { validateNumericString, truncateDecimals } from '@ton/appkit';

import type { AppkitUIToken } from '../../../../types/appkit-ui-token';

interface UseSwapTokenStateOptions {
    mappedTokens: AppkitUIToken[];
    defaultFromId?: string;
    defaultToId?: string;
}

const pickFromToken = (tokens: AppkitUIToken[], defaultId?: string): AppkitUIToken | null =>
    tokens.find((t) => t.id === defaultId) ?? tokens[0] ?? null;

const pickToToken = (tokens: AppkitUIToken[], defaultId?: string): AppkitUIToken | null =>
    tokens.find((t) => t.id === defaultId) ?? tokens[1] ?? null;

export const useSwapTokenState = ({ mappedTokens, defaultFromId, defaultToId }: UseSwapTokenStateOptions) => {
    const [fromToken, setFromToken] = useState<AppkitUIToken | null>(() => pickFromToken(mappedTokens, defaultFromId));
    const [toToken, setToToken] = useState<AppkitUIToken | null>(() => pickToToken(mappedTokens, defaultToId));
    const [fromAmount, setFromAmountRaw] = useState('');

    // Re-select tokens whenever the available list changes (e.g. wallet network switches and
    // `mappedTokens` is filtered down to a different set). Keep the current selection if it's still
    // valid; otherwise fall back to defaults.
    useEffect(() => {
        setFromToken((prev) =>
            prev && mappedTokens.some((t) => t.address === prev.address)
                ? prev
                : pickFromToken(mappedTokens, defaultFromId),
        );
        setToToken((prev) =>
            prev && mappedTokens.some((t) => t.address === prev.address)
                ? prev
                : pickToToken(mappedTokens, defaultToId),
        );
    }, [mappedTokens, defaultFromId, defaultToId]);

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
};
