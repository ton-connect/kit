/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC, ReactNode } from 'react';

import type { CryptoOnrampWidgetRenderProps } from '../crypto-onramp-widget-ui';
import { CryptoOnrampWidgetUI } from '../crypto-onramp-widget-ui';
import { CryptoOnrampWidgetProvider, useCryptoOnrampContext } from '../crypto-onramp-widget-provider';
import type { CryptoOnrampProviderProps, CryptoOnrampContextType } from '../crypto-onramp-widget-provider';

type DivExtras = Omit<ComponentProps<'div'>, 'children' | keyof CryptoOnrampContextType>;

/**
 * Props for {@link CryptoOnrampWidget} — extends {@link CryptoOnrampProviderProps} (tokens, payment methods, defaults, chain overrides) plus the native `<div>` props the widget root forwards.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface CryptoOnrampWidgetProps extends Omit<CryptoOnrampProviderProps, 'children'>, DivExtras {
    /**
     * Custom render function. When provided, replaces the default {@link CryptoOnrampWidgetUI} and is called with the full {@link CryptoOnrampWidgetRenderProps} (context state, actions and forwarded `<div>` props), so callers can build a fully custom UI on top of the same provider.
     */
    children?: (props: CryptoOnrampWidgetRenderProps) => ReactNode;
}

const CryptoOnrampWidgetContent: FC<{ children?: (props: CryptoOnrampWidgetRenderProps) => ReactNode } & DivExtras> = ({
    children,
    ...rest
}) => {
    const ctx = useCryptoOnrampContext();

    if (children) {
        return <>{children({ ...ctx, ...rest })}</>;
    }

    return <CryptoOnrampWidgetUI {...ctx} {...rest} />;
};

/**
 * Drop-in widget for buying TON-side tokens with a crypto payment from another chain — wraps {@link CryptoOnrampWidgetProvider} (which drives token/method selection, quote fetching, deposit creation and status polling) around {@link CryptoOnrampWidgetUI}. Pass a `children` render function to swap in a fully custom UI while keeping the same provider state.
 *
 * @public
 * @category Component
 * @section Crypto Onramp
 */
export const CryptoOnrampWidget: FC<CryptoOnrampWidgetProps> = ({
    children,
    tokens,
    tokenSections,
    paymentMethods,
    methodSections,
    defaultTokenId,
    defaultMethodId,
    ...rest
}) => {
    return (
        <CryptoOnrampWidgetProvider
            tokens={tokens}
            tokenSections={tokenSections}
            paymentMethods={paymentMethods}
            methodSections={methodSections}
            defaultTokenId={defaultTokenId}
            defaultMethodId={defaultMethodId}
        >
            <CryptoOnrampWidgetContent {...rest}>{children}</CryptoOnrampWidgetContent>
        </CryptoOnrampWidgetProvider>
    );
};
