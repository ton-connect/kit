/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';

import { CryptoOnrampWidgetProvider, useCryptoOnrampContext } from '../crypto-onramp-widget-provider';
import type { CryptoOnrampProviderProps, CryptoOnrampContextType } from '../crypto-onramp-widget-provider';
import { CryptoOnrampWidgetUI } from '../crypto-onramp-widget-ui';

export type { CryptoOnrampContextType };

export interface CryptoOnrampWidgetProps extends Omit<CryptoOnrampProviderProps, 'children'> {
    /** Custom render function — when provided, replaces the default widget UI */
    children?: (props: CryptoOnrampContextType) => ReactNode;
}

const CryptoOnrampWidgetContent: FC<{ children?: (props: CryptoOnrampContextType) => ReactNode }> = ({ children }) => {
    const ctx = useCryptoOnrampContext();

    if (children) {
        return <>{children(ctx)}</>;
    }

    return <CryptoOnrampWidgetUI {...ctx} />;
};

export const CryptoOnrampWidget: FC<CryptoOnrampWidgetProps> = ({
    children,
    tokens,
    tokenSections,
    paymentMethods,
    methodSections,
    defaultTokenId,
    defaultMethodId,
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
            <CryptoOnrampWidgetContent>{children}</CryptoOnrampWidgetContent>
        </CryptoOnrampWidgetProvider>
    );
};
