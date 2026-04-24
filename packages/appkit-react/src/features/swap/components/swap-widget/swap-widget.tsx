/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode, ComponentProps } from 'react';

import type { SwapWidgetRenderProps } from '../swap-widget-ui';
import { SwapWidgetUI } from '../swap-widget-ui';
import { SwapWidgetProvider, useSwapContext } from '../swap-widget-provider';
import type { SwapProviderProps } from '../swap-widget-provider';

/**
 * Props for the SwapWidget component.
 * Inherits all configuration from SwapProviderProps.
 */
export interface SwapWidgetProps extends Omit<SwapProviderProps, 'children'>, Omit<ComponentProps<'div'>, 'children'> {
    /**
     * Custom render function.
     * When provided, it replaces the default widget UI and gives full control over the rendering.
     * Accesses all state and actions from the swap context.
     */
    children?: (props: SwapWidgetRenderProps) => ReactNode;
}

const SwapWidgetContent: FC<
    { children?: (props: SwapWidgetRenderProps) => ReactNode } & Omit<ComponentProps<'div'>, 'children'>
> = ({ children, ...rest }) => {
    const ctx = useSwapContext();

    if (children) {
        return <>{children({ ...ctx, ...rest })}</>;
    }

    return <SwapWidgetUI {...ctx} {...rest} />;
};

/**
 * A high-level component that provides a complete swap interface.
 *
 * It manages the token selection, quote fetching, and transaction building
 * for swaps between TON and Jettons. It can be used as a standalone widget
 * with default UI or customized using a render function.
 */
export const SwapWidget: FC<SwapWidgetProps> = ({
    children,
    tokens,
    tokenSections,
    network,
    fiatSymbol,
    defaultFromId,
    defaultToId,
    defaultSlippage,
    ...rest
}) => {
    return (
        <SwapWidgetProvider
            tokens={tokens}
            tokenSections={tokenSections}
            network={network}
            fiatSymbol={fiatSymbol}
            defaultFromId={defaultFromId}
            defaultToId={defaultToId}
            defaultSlippage={defaultSlippage}
        >
            <SwapWidgetContent {...rest}>{children}</SwapWidgetContent>
        </SwapWidgetProvider>
    );
};
