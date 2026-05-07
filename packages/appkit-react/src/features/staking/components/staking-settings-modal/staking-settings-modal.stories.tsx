/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StakingProvider } from '@ton/appkit';

import { StakingSettingsModal } from './staking-settings-modal';

const makeProvider = (id: string, name: string): StakingProvider =>
    ({
        providerId: id,
        type: 'staking',
        getStakingProviderMetadata: () => ({ name }),
    }) as unknown as StakingProvider;

const tonstakers = makeProvider('tonstakers', 'Tonstakers');
const bemo = makeProvider('bemo', 'bemo');

const meta: Meta<typeof StakingSettingsModal> = {
    title: 'Features/Staking/Internal/StakingSettingsModal',
    component: StakingSettingsModal,
};

export default meta;
type Story = StoryObj<typeof StakingSettingsModal>;

export const Default: Story = {
    args: {
        open: true,
        provider: tonstakers,
        providers: [tonstakers, bemo],
        onClose: () => {},
        onProviderChange: () => {},
    },
};

export const SingleProvider: Story = {
    args: {
        open: true,
        provider: tonstakers,
        providers: [tonstakers],
        onClose: () => {},
        onProviderChange: () => {},
    },
};
