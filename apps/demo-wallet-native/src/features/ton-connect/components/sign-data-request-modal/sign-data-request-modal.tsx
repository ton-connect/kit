/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventSignDataRequest } from '@ton/walletkit';
import { type FC, useState, useMemo, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useWallet } from '@ton/demo-core';

import { DAppInfo } from '../dapp-info';
import { SectionTitle } from '../section-title';
import { ActionButtons } from '../action-buttons';
import { SuccessView } from '../success-view';

import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { AppText } from '@/core/components/app-text';
import { WarningBox } from '@/core/components/warning-box';
import { WalletInfoBlock } from '@/features/wallets';
import { Block } from '@/core/components/block';

interface SignDataRequestModalProps {
    request: EventSignDataRequest;
    isOpen: boolean;
    onApprove: () => void;
    onReject: (reason?: string) => void;
}

export const SignDataRequestModal: FC<SignDataRequestModalProps> = ({ request, isOpen, onApprove, onReject }) => {
    const { savedWallets } = useWallet();

    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentWallet = useMemo(() => {
        if (!request.walletAddress) return null;
        return savedWallets.find((wallet) => wallet.address === request.walletAddress) || null;
    }, [savedWallets, request.walletAddress]);

    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await onApprove();
            setIsLoading(false);
            setShowSuccess(true);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to approve sign data request:', error);
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the sign data request');
    };

    const renderDataPreview = () => {
        const { preview } = request;

        switch (preview.kind) {
            case 'text':
                return (
                    <Block style={[styles.dataPreview, styles.textPreview]}>
                        <AppText style={styles.dataPreviewTitle}>Type: Text Message</AppText>
                        <AppText style={styles.dataPreviewContent} textType="body1">
                            {preview.content}
                        </AppText>
                    </Block>
                );
            case 'binary':
                return (
                    <Block style={[styles.dataPreview, styles.binaryPreview]}>
                        <AppText style={styles.dataPreviewTitle}>Type: Binary Data</AppText>
                        <AppText style={styles.dataPreviewContent} textType="body1">
                            {preview.content}
                        </AppText>
                    </Block>
                );
            case 'cell':
                return (
                    <Block style={styles.dataPreview}>
                        <AppText style={styles.dataPreviewTitle}>Type: TON Cell Data</AppText>
                        <View style={styles.cellContent}>
                            <View style={styles.cellItem}>
                                <AppText style={styles.cellLabel} textType="caption1">
                                    Content
                                </AppText>
                                <ScrollView horizontal style={styles.cellValue}>
                                    <AppText style={styles.cellValueText} textType="body1">
                                        {preview.content}
                                    </AppText>
                                </ScrollView>
                            </View>

                            {preview.schema && (
                                <View style={styles.cellItem}>
                                    <AppText style={styles.cellLabel} textType="caption1">
                                        Schema
                                    </AppText>
                                    <ScrollView horizontal style={styles.cellValue}>
                                        <AppText style={styles.cellValueText} textType="body1">
                                            {preview.schema}
                                        </AppText>
                                    </ScrollView>
                                </View>
                            )}

                            {preview.parsed && (
                                <View style={styles.cellItem}>
                                    <AppText style={styles.cellLabel} textType="caption1">
                                        Parsed Data
                                    </AppText>
                                    <ScrollView style={styles.parsedData}>
                                        <AppText style={styles.parsedDataText} textType="caption1">
                                            {JSON.stringify(preview.parsed, null, 2)}
                                        </AppText>
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </Block>
                );
            default:
                return (
                    <Block style={styles.dataPreview}>
                        <AppText style={styles.dataPreviewContent} textType="body1">
                            Unknown data format
                        </AppText>
                    </Block>
                );
        }
    };

    if (showSuccess) {
        return (
            <AppBottomSheet isOpened={isOpen} onClose={() => {}} isDisabledClose isScrollable={false}>
                <SuccessView subtitle="Data signed successfully" />
            </AppBottomSheet>
        );
    }

    return (
        <AppBottomSheet isOpened={isOpen} onClose={handleReject} title="Sign Data Request" enableDynamicSizing>
            <View style={styles.container}>
                <DAppInfo
                    name={request.dAppInfo?.name}
                    description={request.dAppInfo?.description}
                    url={request.dAppInfo?.url}
                    iconUrl={request.dAppInfo?.iconUrl}
                />

                {currentWallet && (
                    <View style={styles.walletSection}>
                        <SectionTitle>Signing with:</SectionTitle>
                        <WalletInfoBlock name={currentWallet.name} address={currentWallet.address} />
                    </View>
                )}

                <View style={styles.dataSection}>
                    <SectionTitle>Data to Sign</SectionTitle>
                    {renderDataPreview()}
                </View>

                <WarningBox variant="warning">
                    Warning: Only sign data if you trust the requesting dApp and understand what you're signing. Signing
                    data can have security implications.
                </WarningBox>

                <ActionButtons
                    primaryText={isLoading ? 'Signing...' : 'Sign Data'}
                    onPrimaryPress={handleApprove}
                    onSecondaryPress={handleReject}
                    isLoading={isLoading}
                />
            </View>
        </AppBottomSheet>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        gap: sizes.space.vertical,
        paddingBottom: sizes.space.vertical,
    },
    walletSection: {
        gap: sizes.space.vertical / 2,
    },
    dataSection: {
        gap: sizes.space.vertical / 2,
    },
    dataPreview: {
        paddingHorizontal: sizes.space.horizontal / 2,
        backgroundColor: colors.background.secondary,
    },
    textPreview: {
        backgroundColor: colors.accent.primaryLight,
    },
    binaryPreview: {
        backgroundColor: colors.status.successBackground,
    },
    dataPreviewTitle: {
        color: colors.text.highlight,
        marginBottom: sizes.space.vertical / 2,
    },
    dataPreviewContent: {
        color: colors.text.default,
    },
    cellContent: {
        gap: sizes.space.vertical / 2,
    },
    cellItem: {
        gap: 4,
    },
    cellLabel: {
        color: colors.text.secondary,
    },
    cellValue: {
        maxHeight: 60,
    },
    cellValueText: {
        color: colors.text.default,
        fontFamily: 'monospace',
    },
    parsedData: {
        maxHeight: 100,
        backgroundColor: colors.background.main,
        borderRadius: 4,
        padding: 8,
    },
    parsedDataText: {
        color: colors.text.default,
        fontFamily: 'monospace',
    },
}));
