/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useNfts, useWallet } from '@ton/demo-core';
import type { NftItem } from '@ton/walletkit';
import { type FC, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { LegendList } from '@legendapp/list';

import { NftDetailsModal } from '../nft-details-modal';
import { NftItemCard } from '../nft-item';

import { LoaderCircle } from '@/core/components/loader-circle';
import { InfoBlock } from '@/core/components/info-block';

export const NftList: FC = () => {
    const { address } = useWallet();
    const { lastNftsUpdate, userNfts, isLoadingNfts, error, loadUserNfts, formatNftIndex } = useNfts();
    const { theme } = useUnistyles();
    const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);

    // Load NFTs on mount if none are loaded
    useEffect(() => {
        if (lastNftsUpdate > 0 && Date.now() - lastNftsUpdate < 10000) {
            return;
        }
        loadUserNfts();
    }, [address, loadUserNfts, lastNftsUpdate]);

    // Auto refresh NFTs every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadUserNfts();
        }, 30000);
        return () => clearInterval(interval);
    }, [loadUserNfts]);

    const handleNftPress = useCallback((nft: NftItem) => {
        setSelectedNft(nft);
    }, []);

    const renderNftItem = useCallback(
        ({ item: nft }: { item: NftItem }) => (
            <NftItemCard nft={nft} onPress={handleNftPress} formatNftIndex={formatNftIndex} />
        ),
        [handleNftPress, formatNftIndex],
    );

    const keyExtractor = useCallback((item: NftItem) => item.address, []);

    // Error state
    if (error) {
        return (
            <InfoBlock.Container>
                <InfoBlock.Icon name="alert-circle" color={theme.colors.error.default} />
                <InfoBlock.Title>Error loading NFTs</InfoBlock.Title>
                <InfoBlock.Subtitle>{error || 'We are sorry, something went wrong'}</InfoBlock.Subtitle>
            </InfoBlock.Container>
        );
    }

    // Loading state
    if (isLoadingNfts && userNfts.length === 0) {
        return (
            <InfoBlock.Container>
                <LoaderCircle size={35} style={styles.loader} />
                <InfoBlock.Title>Loading NFTs...</InfoBlock.Title>
            </InfoBlock.Container>
        );
    }

    // Empty state
    if (!userNfts || userNfts.length === 0) {
        return (
            <InfoBlock.Container>
                <InfoBlock.Icon color={theme.colors.text.secondary} name="images-outline" />
                <InfoBlock.Title>No NFTs yet</InfoBlock.Title>
                <InfoBlock.Subtitle>Your NFT collection will appear here</InfoBlock.Subtitle>
            </InfoBlock.Container>
        );
    }

    return (
        <View style={styles.container}>
            <LegendList
                data={userNfts}
                renderItem={renderNftItem}
                keyExtractor={keyExtractor}
                estimatedItemSize={80}
                showsVerticalScrollIndicator={false}
            />

            {/* NFT Details Modal */}
            <NftDetailsModal nft={selectedNft} visible={selectedNft !== null} onClose={() => setSelectedNft(null)} />
        </View>
    );
};

const styles = StyleSheet.create(({ sizes }) => ({
    container: {
        flex: 1,
    },
    loader: {
        marginBottom: sizes.space.vertical,
    },
}));
