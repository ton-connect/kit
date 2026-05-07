/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { STORY_TOKENS } from '../../../../storybook/fixtures/tokens';
import { TonPayWidget } from './ton-pay-widget';

const meta: Meta<typeof TonPayWidget> = {
    title: 'Features/Onramp/TonPayWidget',
    component: TonPayWidget,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TonPayWidget>;

export const Default: Story = {
    args: {
        tokens: STORY_TOKENS,
        defaultTokenId: 'ton',
    },
};
