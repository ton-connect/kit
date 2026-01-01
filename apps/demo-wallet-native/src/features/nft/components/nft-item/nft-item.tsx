/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/walletkit';
import { formatAddress } from '@demo/core';
import { memo } from 'react';
import type { FC } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

import { getCollectionName, getNftImage, getNftName } from '../../utils';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

interface NftItemCardProps {
    nft: NFT;
    onPress: (nft: NFT) => void;
    formatNftIndex: (index: string) => string;
}

export const NftItemCard: FC<NftItemCardProps> = memo(({ nft, onPress, formatNftIndex }) => {
    const { theme } = useUnistyles();

    const nftImage = getNftImage(nft);
    const nftName = getNftName(nft, formatNftIndex);
    const collectionName = getCollectionName(nft);

    return (
        <TouchableOpacity onPress={() => onPress(nft)}>
            <Block style={styles.nftItem}>
                <View style={styles.nftInfo}>
                    {nftImage ? (
                        <Image source={{ uri: nftImage }} style={styles.nftImage} />
                    ) : (
                        <View style={styles.nftImagePlaceholder}>
                            <Ionicons color={theme.colors.text.secondary} name="image-outline" size={24} />
                        </View>
                    )}

                    <View style={styles.nftDetails}>
                        <AppText style={styles.nftName} numberOfLines={1}>
                            {nftName}
                        </AppText>

                        <AppText style={styles.nftCollection} numberOfLines={1}>
                            {collectionName || formatAddress(nft.address, 4)}
                        </AppText>

                        {nft.isOnSale && (
                            <View style={styles.onSaleBadge}>
                                <AppText style={styles.onSaleText}>On Sale</AppText>
                            </View>
                        )}
                    </View>
                </View>

                <Ionicons color={theme.colors.text.secondary} name="chevron-forward" size={20} />
            </Block>
        </TouchableOpacity>
    );
});

NftItemCard.displayName = 'NftItemCard';

const styles = StyleSheet.create(({ sizes, colors }) => ({
    nftItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: sizes.space.vertical * 2,
    },
    nftInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
        flex: 1,
    },
    nftImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    nftImagePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: colors.navigation.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nftDetails: {
        flex: 1,
        gap: sizes.space.vertical / 4,
    },
    nftName: {
        color: colors.text.highlight,
    },
    nftCollection: {
        color: colors.text.secondary,
    },
    onSaleBadge: {
        backgroundColor: colors.success.default,
        paddingHorizontal: sizes.space.horizontal / 2,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    onSaleText: {
        color: colors.text.inverted,
    },
}));
