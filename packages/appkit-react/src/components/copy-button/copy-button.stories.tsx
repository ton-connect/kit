/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { CopyButton } from './copy-button';

const meta: Meta<typeof CopyButton> = {
    title: 'Internal/Components/CopyButton',
    component: CopyButton,
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {
    args: {
        value: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        'aria-label': 'Copy address',
    },
};
