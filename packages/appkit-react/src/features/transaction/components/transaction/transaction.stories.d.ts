/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { Meta, StoryObj } from '@storybook/react';
declare const TransactionButtonPreview: ({ text, isLoading, disabled, }: {
    text?: string;
    isLoading?: boolean;
    disabled?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof TransactionButtonPreview>;
export default meta;
type Story = StoryObj<typeof TransactionButtonPreview>;
export declare const Default: Story;
export declare const CustomText: Story;
export declare const Loading: Story;
export declare const Disabled: Story;
export declare const SendTonButton: Story;
export declare const SendJettonButton: Story;
//# sourceMappingURL=transaction.stories.d.ts.map