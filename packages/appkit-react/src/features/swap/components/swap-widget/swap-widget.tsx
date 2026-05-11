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
 * Props accepted by {@link SwapWidget} — extend {@link SwapProviderProps} (swap configuration: tokens, network, defaults) with the standard `<div>` attributes and an optional render-prop override.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface SwapWidgetProps extends Omit<SwapProviderProps, 'children'>, Omit<ComponentProps<'div'>, 'children'> {
    /** Optional render-prop receiving the full swap context plus the forwarded `<div>` props; when supplied it replaces the default {@link SwapWidgetUI}. */
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
 * Drop-in swap UI that walks the user through picking the source/target tokens, entering an amount, reviewing the quote (rate, min-received, slippage, provider), and confirming the swap — which builds the transaction via {@link useBuildSwapTransaction} and dispatches it through the standard send flow. Internally mounts a {@link SwapWidgetProvider} so the rendered UI (default {@link SwapWidgetUI} or a custom `children` render-prop) can read state through {@link useSwapContext}.
 *
 * @public
 * @category Component
 * @section Swap
 */
export const SwapWidget: FC<SwapWidgetProps> = ({
    children,
    tokens,
    tokenSections,
    network,
    fiatSymbol,
    defaultFromSymbol,
    defaultToSymbol,
    defaultSlippage,
    ...rest
}) => {
    return (
        <SwapWidgetProvider
            tokens={tokens}
            tokenSections={tokenSections}
            network={network}
            fiatSymbol={fiatSymbol}
            defaultFromSymbol={defaultFromSymbol}
            defaultToSymbol={defaultToSymbol}
            defaultSlippage={defaultSlippage}
        >
            <SwapWidgetContent {...rest}>{children}</SwapWidgetContent>
        </SwapWidgetProvider>
    );
};
