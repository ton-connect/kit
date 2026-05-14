/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SwapProvider } from '@ton/appkit';

import { SwapSettingsModal } from './swap-settings-modal';

const makeProvider = (id: string, name: string): SwapProvider =>
    ({
        providerId: id,
        type: 'swap',
        getMetadata: () => ({ name }),
    }) as unknown as SwapProvider;

const stonfi = makeProvider('stonfi', 'STON.fi');
const dedust = makeProvider('dedust', 'DeDust');

const meta: Meta<typeof SwapSettingsModal> = {
    title: 'Features/Swap/Internal/SwapSettingsModal',
    component: SwapSettingsModal,
};

export default meta;
type Story = StoryObj<typeof SwapSettingsModal>;

export const Default: Story = {
    args: {
        open: true,
        slippage: 50,
        provider: stonfi,
        providers: [stonfi, dedust],
        onClose: () => {},
        onSlippageChange: () => {},
        onProviderChange: () => {},
    },
};

export const SingleProvider: Story = {
    args: {
        open: true,
        slippage: 100,
        provider: stonfi,
        providers: [stonfi],
        onClose: () => {},
        onSlippageChange: () => {},
        onProviderChange: () => {},
    },
};

export const HighSlippage: Story = {
    args: {
        open: true,
        slippage: 600,
        provider: dedust,
        providers: [stonfi, dedust],
        onClose: () => {},
        onSlippageChange: () => {},
        onProviderChange: () => {},
    },
};
