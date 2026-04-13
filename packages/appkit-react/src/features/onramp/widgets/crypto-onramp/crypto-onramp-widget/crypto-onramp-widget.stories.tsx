/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { STORY_TOKENS } from '../../../../../storybook/fixtures/tokens';
import { CryptoOnrampWidget } from './crypto-onramp-widget';

const meta: Meta<typeof CryptoOnrampWidget> = {
    title: 'Public/Features/Onramp/CryptoOnrampWidget',
    component: CryptoOnrampWidget,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CryptoOnrampWidget>;

export const Default: Story = {
    args: {
        tokens: STORY_TOKENS,
        defaultTokenId: 'ton',
        defaultMethodId: 'btc',
        methodSections: [{ title: 'Popular tokens', ids: ['ton', 'btc', 'usdt-tron'] }],
        tokenSections: [{ title: 'Popular', ids: ['ton', 'usdt'] }],
    },
};

export const NoSections: Story = {
    args: {
        tokens: STORY_TOKENS,
        defaultTokenId: 'ton',
        defaultMethodId: 'usdt-eth',
    },
};
