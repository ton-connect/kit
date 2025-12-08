/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItem } from '@ton/walletkit';
import { type FC } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { formatAddress, useNfts } from '@ton/demo-core';
import * as Clipboard from 'expo-clipboard';

import { getCollectionName, getNftDescription, getNftImage, getNftName, getCollectionDescription } from '../../utils';

import { AppText } from '@/core/components/app-text';
import { AppModal } from '@/core/components/app-modal';
import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { Block } from '@/core/components/block';
import { useAppToasts } from '@/features/toasts';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';

interface NftDetailsModalProps {
    nft: NftItem | null;
    visible: boolean;
    onClose: () => void;
}

export const NftDetailsModal: FC<NftDetailsModalProps> = ({ nft, visible, onClose }) => {
    const { formatNftIndex } = useNfts();
    const { theme } = useUnistyles();
    const { toast } = useAppToasts();

    const handleCopy = (value: string) => () => {
        try {
            Clipboard.setStringAsync(value);

            toast({
                title: 'Copied!',
                type: 'success',
            });
        } catch (error) {
            toast({
                title: 'Error',
                subtitle: getErrorMessage(error),
                type: 'error',
            });
        }
    };

    if (!nft) {
        return null;
    }

    const nftImage = getNftImage(nft);
    const nftName = getNftName(nft, formatNftIndex);
    const nftDescription = getNftDescription(nft);
    const collectionName = getCollectionName(nft);
    const collectionDescription = getCollectionDescription(nft);

    return (
        <AppModal visible={visible} onRequestClose={onClose}>
            <View style={styles.header}>
                <AppText style={styles.headerTitle} textType="h4" numberOfLines={1}>
                    {nftName}
                </AppText>

                <ActiveTouchAction onPress={onClose}>
                    <Ionicons color={theme.colors.text.secondary} name="close" size={24} />
                </ActiveTouchAction>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Block style={styles.block}>
                    <View style={styles.imageContainer}>
                        {nftImage ? (
                            <Image source={{ uri: nftImage }} style={styles.nftImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons color={theme.colors.text.secondary} name="image-outline" size={64} />
                            </View>
                        )}
                    </View>

                    <View style={styles.blockContent}>
                        {nftDescription && (
                            <View style={styles.section}>
                                <AppText style={styles.sectionLabel}>Description</AppText>
                                <AppText style={styles.sectionValue}>{nftDescription}</AppText>
                            </View>
                        )}

                        {nft.collection && (
                            <View style={styles.section}>
                                <AppText style={styles.sectionLabel}>Collection</AppText>
                                <AppText style={styles.sectionValue}>{collectionName || 'Unknown Collection'}</AppText>
                                {collectionDescription && (
                                    <AppText style={styles.sectionSubvalue}>{collectionDescription}</AppText>
                                )}
                            </View>
                        )}

                        <View style={styles.section}>
                            <AppText style={styles.sectionLabel}>Status</AppText>
                            <AppText style={styles.sectionValue}>{nft.onSale ? 'On Sale' : 'Not for Sale'}</AppText>
                        </View>

                        <View style={styles.section}>
                            <AppText style={styles.sectionLabel}>Contract Address</AppText>
                            <TouchableOpacity style={styles.addressRow} onPress={handleCopy(nft.address)}>
                                <AppText style={styles.sectionValue}>{formatAddress(nft.address)}</AppText>

                                <Ionicons color={theme.colors.text.secondary} name="copy-outline" size={16} />
                            </TouchableOpacity>
                        </View>

                        {nft.ownerAddress && (
                            <View style={styles.section}>
                                <AppText style={styles.sectionLabel}>Owner</AppText>

                                <TouchableOpacity style={styles.addressRow} onPress={handleCopy(nft.ownerAddress!)}>
                                    <AppText style={styles.sectionValue}>{formatAddress(nft.ownerAddress)}</AppText>

                                    <Ionicons color={theme.colors.text.secondary} name="copy-outline" size={16} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Block>
            </ScrollView>
        </AppModal>
    );
};

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: sizes.page.paddingHorizontal,
        paddingVertical: sizes.space.vertical * 2,
    },
    headerTitle: {
        color: colors.text.highlight,
        flex: 1,
        marginRight: sizes.space.horizontal,
    },
    content: {
        paddingHorizontal: sizes.page.paddingHorizontal,
    },
    contentContainer: {
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    block: {
        overflow: 'hidden',
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    blockContent: {
        paddingHorizontal: sizes.block.paddingHorizontal,
        paddingTop: sizes.block.paddingVertical,
    },
    imageContainer: {
        overflow: 'hidden',
    },
    nftImage: {
        width: '100%',
        height: 300,
    },
    imagePlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: colors.navigation.default,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    section: {
        marginBottom: sizes.space.vertical * 2,
    },
    sectionLabel: {
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: sizes.space.vertical / 2,
    },
    sectionValue: {
        color: colors.text.highlight,
        fontSize: 16,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
    },
    sectionSubvalue: {
        color: colors.text.secondary,
        fontSize: 14,
        marginTop: sizes.space.vertical / 4,
    },
}));
