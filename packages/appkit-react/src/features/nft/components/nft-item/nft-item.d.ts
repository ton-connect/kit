/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { NFT } from '@ton/appkit';
import type { FC, ComponentProps } from 'react';
export interface NftItemProps extends ComponentProps<'button'> {
    nft: NFT;
}
export declare const NftItem: FC<NftItemProps>;
//# sourceMappingURL=nft-item.d.ts.map