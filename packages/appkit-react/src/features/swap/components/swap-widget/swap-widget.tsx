/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';

import type { SwapWidgetRenderProps } from '../swap-widget-ui';
import { SwapWidgetUI } from '../swap-widget-ui';
import { SwapWidgetProvider, useSwapContext } from '../swap-widget-provider';
import type { SwapProviderProps } from '../swap-widget-provider';

export interface SwapWidgetProps extends Omit<SwapProviderProps, 'children'> {
    /** Custom render function — when provided, replaces the default widget UI */
    children?: (props: SwapWidgetRenderProps) => ReactNode;
}

const SwapWidgetContent: FC<{ children?: (props: SwapWidgetRenderProps) => ReactNode }> = ({ children }) => {
    const ctx = useSwapContext();

    if (children) {
        return <>{children(ctx)}</>;
    }

    return <SwapWidgetUI {...ctx} />;
};

export const SwapWidget: FC<SwapWidgetProps> = ({
    children,
    tokens,
    network,
    fiatSymbol,
    defaultFromSymbol,
    defaultToSymbol,
    defaultSlippage,
}) => {
    return (
        <SwapWidgetProvider
            tokens={tokens}
            network={network}
            fiatSymbol={fiatSymbol}
            defaultFromSymbol={defaultFromSymbol}
            defaultToSymbol={defaultToSymbol}
            defaultSlippage={defaultSlippage}
        >
            <SwapWidgetContent>{children}</SwapWidgetContent>
        </SwapWidgetProvider>
    );
};
