/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { RefreshControl } from 'react-native';
import { useNfts } from '@demo/core';

import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { noop } from '@/core/utils/noop';
import { NftList } from '@/features/nft';

const NftScreen: FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { loadUserNfts } = useNfts();

    const refreshNfts = async () => {
        setIsRefreshing(true);
        await loadUserNfts().catch(noop);
        setIsRefreshing(false);
    };

    return (
        <ScreenWrapper refreshControl={<RefreshControl onRefresh={refreshNfts} refreshing={isRefreshing} />}>
            <ScreenHeader.Container>
                <ScreenHeader.Title>NFTs</ScreenHeader.Title>
            </ScreenHeader.Container>

            <NftList />
        </ScreenWrapper>
    );
};

export default NftScreen;
