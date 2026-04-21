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
 * Props for the StakingWidget component.
 */
export interface StakingWidgetProps
    extends Omit<StakingProviderProps, 'children'>, Omit<ComponentProps<'div'>, 'children'> {
    /**
     * Custom render function.
     * When provided, it replaces the default widget UI and gives full control over the rendering.
     * Useful for building unique staking interfaces while leveraging the widget's internal logic.
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
 * A high-level component that provides a complete staking interface.
 *
 * It manages the staking lifecycle, including fetching quotes, building transactions,
 * and handling user input. It can be used as a standalone widget with default UI
 * or customized using a render function.
 */
export const StakingWidget: FC<StakingWidgetProps> = ({ children, network, ...rest }) => {
    return (
        <StakingWidgetProvider network={network}>
            <StakingWidgetContent {...rest}>{children}</StakingWidgetContent>
        </StakingWidgetProvider>
    );
};
