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
 * Props for the CryptoOnrampWidget component.
 * Inherits all configuration from CryptoOnrampProviderProps.
 */
export interface CryptoOnrampWidgetProps extends Omit<CryptoOnrampProviderProps, 'children'>, DivExtras {
    /**
     * Custom render function.
     * When provided, it replaces the default widget UI and gives full control over the rendering.
     * Accesses all state and actions from the crypto onramp context.
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
 * A high-level component that provides a complete crypto-to-crypto onramp interface.
 *
 * It manages payment method selection, quote fetching, deposit creation, and
 * deposit status tracking. It can be used as a standalone widget with default UI
 * or customized using a render function.
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
