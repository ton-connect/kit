/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { Meta, StoryObj } from '@storybook/react';
declare const SendJettonButtonPreview: ({ text, isLoading, disabled, }: {
    text?: string;
    isLoading?: boolean;
    disabled?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof SendJettonButtonPreview>;
export default meta;
type Story = StoryObj<typeof SendJettonButtonPreview>;
export declare const USDT: Story;
export declare const NOT: Story;
export declare const WithoutAmount: Story;
export declare const Loading: Story;
export declare const Disabled: Story;
//# sourceMappingURL=send-jetton-button.stories.d.ts.map