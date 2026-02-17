/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { Meta, StoryObj } from '@storybook/react';
declare const NftItemPreview: ({ name, collectionName, image, isOnSale, onClick, className, }: {
    name: string;
    collectionName: string;
    image?: string;
    isOnSale?: boolean;
    onClick?: () => void;
    className?: string;
}) => import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof NftItemPreview>;
export default meta;
type Story = StoryObj<typeof NftItemPreview>;
export declare const WithImage: Story;
export declare const WithoutImage: Story;
export declare const OnSale: Story;
export declare const LongName: Story;
export declare const NftGrid: Story;
//# sourceMappingURL=nft-item.stories.d.ts.map