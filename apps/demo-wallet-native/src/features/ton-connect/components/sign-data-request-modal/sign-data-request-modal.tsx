/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SignDataRequestEvent } from '@ton/walletkit';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { View, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useWallet } from '@demo/core';

import { DAppInfo } from '../dapp-info';
import { SectionTitle } from '../section-title';
import { ActionButtons } from '../action-buttons';
import { SuccessView } from '../success-view';

import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { AppText } from '@/core/components/app-text';
import { WarningBox } from '@/core/components/warning-box';
import { WalletInfoBlock } from '@/features/wallets';
import { Block } from '@/core/components/block';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { getLedgerErrorMessage } from '@/features/ledger';

interface SignDataRequestModalProps {
    request: SignDataRequestEvent;
    isOpen: boolean;
    onApprove: () => void;
    onReject: (reason?: string) => void;
}

export const SignDataRequestModal: FC<SignDataRequestModalProps> = ({ request, isOpen, onApprove, onReject }) => {
    const { savedWallets } = useWallet();
    const { theme } = useUnistyles();

    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentWallet = useMemo(() => {
        if (!request.walletAddress) return null;
        return savedWallets.find((wallet) => wallet.kitWalletId === request.walletId) || null;
    }, [savedWallets, request.walletAddress]);

    const isLedgerWallet = currentWallet?.walletType === 'ledger';

    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen]);

    const handleApprove = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await onApprove();
            setIsLoading(false);
            setShowSuccess(true);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to approve sign data request:', err);
            const errorMessage = isLedgerWallet ? getLedgerErrorMessage(err) : getErrorMessage(err);
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            await onReject('User rejected the sign data request');
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to reject sign data request:', err);
        }
    };

    const renderDataPreview = () => {
        const { preview } = request;

        switch (preview.data.type) {
            case 'text':
                return (
                    <Block style={[styles.dataPreview, styles.textPreview]}>
                        <AppText style={styles.dataPreviewTitle}>Type: Text Message</AppText>
                        <AppText style={styles.dataPreviewContent} textType="body1">
                            {preview.data.value.content}
                        </AppText>
                    </Block>
                );
            case 'binary':
                return (
                    <Block style={[styles.dataPreview, styles.binaryPreview]}>
                        <AppText style={styles.dataPreviewTitle}>Type: Binary Data</AppText>
                        <AppText style={styles.dataPreviewContent} textType="body1">
                            {preview.data.value.content}
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
                                        {preview.data.value.content}
                                    </AppText>
                                </ScrollView>
                            </View>

                            {preview.data.value.schema && (
                                <View style={styles.cellItem}>
                                    <AppText style={styles.cellLabel} textType="caption1">
                                        Schema
                                    </AppText>
                                    <ScrollView horizontal style={styles.cellValue}>
                                        <AppText style={styles.cellValueText} textType="body1">
                                            {preview.data.value.schema}
                                        </AppText>
                                    </ScrollView>
                                </View>
                            )}

                            {preview.data.value.parsed && (
                                <View style={styles.cellItem}>
                                    <AppText style={styles.cellLabel} textType="caption1">
                                        Parsed Data
                                    </AppText>
                                    <ScrollView style={styles.parsedData}>
                                        <AppText style={styles.parsedDataText} textType="caption1">
                                            {JSON.stringify(preview.data.value.parsed, null, 2)}
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

                {error && <WarningBox variant="error">{error}</WarningBox>}

                {isLedgerWallet && isLoading && (
                    <View style={styles.ledgerPrompt}>
                        <Ionicons name="hardware-chip-outline" size={24} color={theme.colors.accent.primary} />
                        <View style={styles.ledgerPromptText}>
                            <AppText style={styles.ledgerPromptTitle} textType="body1">
                                Confirm on Ledger
                            </AppText>
                            <AppText style={styles.ledgerPromptHint}>
                                Please review and confirm this signature on your Ledger device
                            </AppText>
                        </View>
                    </View>
                )}

                <WarningBox variant="warning">
                    Warning: Only sign data if you trust the requesting dApp and understand what you're signing. Signing
                    data can have security implications.
                </WarningBox>

                <ActionButtons
                    primaryText={isLoading ? (isLedgerWallet ? 'Waiting for Ledger...' : 'Signing...') : 'Sign Data'}
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
    ledgerPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal,
        padding: sizes.space.horizontal,
        backgroundColor: colors.accent.primary + '15',
        borderRadius: sizes.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.accent.primary + '30',
    },
    ledgerPromptText: {
        flex: 1,
        gap: 2,
    },
    ledgerPromptTitle: {
        color: colors.text.highlight,
        fontWeight: '600',
    },
    ledgerPromptHint: {
        color: colors.text.secondary,
        fontSize: 13,
    },
}));
