/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { WalletItem } from './index';
import { FourWalletsCard, FourWalletsImage } from './four-wallets.style';

interface FourWallets {
    labelLine1: string;
    labelLine2: string;
    images: string[];
    onClick: () => void;
}

export const FourWalletsItem: Component<FourWallets> = (props) => {
    return (
        <WalletItem
            name={props.labelLine1}
            secondLine={props.labelLine2}
            icon={
                <FourWalletsCard>
                    <For each={[0, 1, 2, 3]}>{(index) => <FourWalletsImage src={props.images[index]!} />}</For>
                </FourWalletsCard>
            }
            onClick={() => props.onClick()}
        />
    );
};
