/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';

import type { StakingWidgetRenderProps } from '../staking-widget-ui';
import { StakingWidgetUI } from '../staking-widget-ui';
import { StakingWidgetProvider, useStakingContext } from '../staking-widget-provider';
import type { StakingProviderProps } from '../staking-widget-provider';

export interface StakingWidgetProps extends Omit<StakingProviderProps, 'children'> {
    /** Custom render function — when provided, replaces the default widget UI */
    children?: (props: StakingWidgetRenderProps) => ReactNode;
}

const StakingWidgetContent: FC<{ children?: (props: StakingWidgetRenderProps) => ReactNode }> = ({ children }) => {
    const ctx = useStakingContext();

    if (children) {
        return <>{children(ctx)}</>;
    }

    return <StakingWidgetUI {...ctx} />;
};

export const StakingWidget: FC<StakingWidgetProps> = ({ children, network, fiatSymbol, tonRate }) => {
    return (
        <StakingWidgetProvider network={network} fiatSymbol={fiatSymbol} tonRate={tonRate}>
            <StakingWidgetContent>{children}</StakingWidgetContent>
        </StakingWidgetProvider>
    );
};
