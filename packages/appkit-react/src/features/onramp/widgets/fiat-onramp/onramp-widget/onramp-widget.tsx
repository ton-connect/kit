/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';

import type { OnrampWidgetRenderProps } from '../onramp-widget-ui';
import { OnrampWidgetUI } from '../onramp-widget-ui';
import { OnrampWidgetProvider, useOnrampContext } from '../onramp-widget-provider';
import type { OnrampProviderProps } from '../onramp-widget-provider';

export interface OnrampWidgetProps extends Omit<OnrampProviderProps, 'children'> {
    /** Custom render function — when provided, replaces the default widget UI */
    children?: (props: OnrampWidgetRenderProps) => ReactNode;
}

const OnrampWidgetContent: FC<{ children?: (props: OnrampWidgetRenderProps) => ReactNode }> = ({ children }) => {
    const ctx = useOnrampContext();

    if (children) {
        return <>{children(ctx)}</>;
    }

    return <OnrampWidgetUI {...ctx} />;
};

export const OnrampWidget: FC<OnrampWidgetProps> = ({
    children,
    tokens,
    tokenSections,
    currencySections,
    defaultTokenId,
    defaultCurrencyId,
}) => {
    return (
        <OnrampWidgetProvider
            tokens={tokens}
            tokenSections={tokenSections}
            currencySections={currencySections}
            defaultTokenId={defaultTokenId}
            defaultCurrencyId={defaultCurrencyId}
        >
            <OnrampWidgetContent>{children}</OnrampWidgetContent>
        </OnrampWidgetProvider>
    );
};
