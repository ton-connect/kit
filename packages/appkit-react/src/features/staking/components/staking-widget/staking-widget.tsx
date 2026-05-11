/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode, ComponentProps } from 'react';

import type { StakingWidgetRenderProps } from '../staking-widget-ui';
import { StakingWidgetUI } from '../staking-widget-ui';
import { StakingWidgetProvider, useStakingContext } from '../staking-widget-provider';
import type { StakingProviderProps } from '../staking-widget-provider';

/**
 * Props accepted by {@link StakingWidget}. Extends {@link StakingProviderProps} (e.g. `network`) and standard `<div>` props forwarded to the default UI.
 *
 * @public
 * @category Type
 * @section Staking
 */
export interface StakingWidgetProps
    extends Omit<StakingProviderProps, 'children'>, Omit<ComponentProps<'div'>, 'children'> {
    /**
     * Optional render-prop. When provided, the default {@link StakingWidgetUI} is bypassed and this function is called with the full {@link StakingWidgetRenderProps} (context state + forwarded `<div>` props), letting consumers build a custom UI on top of the widget's internal logic.
     */
    children?: (props: StakingWidgetRenderProps) => ReactNode;
}

const StakingWidgetContent: FC<
    { children?: (props: StakingWidgetRenderProps) => ReactNode } & Omit<ComponentProps<'div'>, 'children'>
> = ({ children, ...rest }) => {
    const ctx = useStakingContext();

    if (children) {
        return <>{children({ ...ctx, ...rest })}</>;
    }

    return <StakingWidgetUI {...ctx} {...rest} />;
};

/**
 * High-level staking widget that wires the full stake/unstake flow: pick a provider, enter an amount (with optional reverse input on supported providers), review the quote (APY, exchange rate, "you get"), then submit the transaction. Internally wraps {@link StakingWidgetProvider} around {@link StakingWidgetUI}; consumers can replace the UI by passing a render-prop `children` while keeping the widget's state, quoting, balance checks, and submission logic.
 *
 * @public
 * @category Component
 * @section Staking
 */
export const StakingWidget: FC<StakingWidgetProps> = ({ children, network, ...rest }) => {
    return (
        <StakingWidgetProvider network={network}>
            <StakingWidgetContent {...rest}>{children}</StakingWidgetContent>
        </StakingWidgetProvider>
    );
};
