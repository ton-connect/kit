/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectionRequestEvent, Wallet } from '@ton/walletkit';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@demo/core';
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { DAppInfo } from '../dapp-info';
import { PermissionItem } from '../permission-item';
import { SectionTitle } from '../section-title';
import { ActionButtons } from '../action-buttons';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { AppText } from '@/core/components/app-text';
import { WarningBox } from '@/core/components/warning-box';
import { WalletInfoBlock, WalletSelectorModal } from '@/features/wallets';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { getLedgerErrorMessage } from '@/features/ledger';

interface ConnectRequestModalProps {
    request: ConnectionRequestEvent;
    isOpen: boolean;
    onApprove: (selectedWallet: Wallet) => void;
    onReject: (reason?: string) => void;
}

export const ConnectRequestModal: FC<ConnectRequestModalProps> = ({ request, isOpen, onApprove, onReject }) => {
    const { savedWallets, getAvailableWallets } = useWallet();
    const { theme } = useUnistyles();

    const [availableWallets, setAvailableWallets] = useState<Wallet[]>(getAvailableWallets());
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(availableWallets[0] || null);
    const [isLoading, setIsLoading] = useState(false);
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedWalletData = selectedWallet
        ? savedWallets.find((w) => w.address === selectedWallet.getAddress())
        : undefined;
    const isLedgerWallet = selectedWalletData?.walletType === 'ledger';

    useEffect(() => {
        if (selectedWallet !== null) return;

        const intervalId = setInterval(() => {
            const availableWallets = getAvailableWallets();
            setAvailableWallets(availableWallets);

            if (availableWallets[0]) {
                setSelectedWallet(availableWallets[0]);
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, [selectedWallet, getAvailableWallets]);

    const handleApprove = async () => {
        if (!selectedWallet) return;

        setIsLoading(true);
        setError(null);

        try {
            await onApprove(selectedWallet);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to approve connection:', err);
            setError(isLedgerWallet ? getLedgerErrorMessage(err) : getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the connection');
    };

    return (
        <>
            <AppBottomSheet isOpened={isOpen} onClose={handleReject} title="Connect Request" stackBehavior="push">
                <View style={styles.container}>
                    <DAppInfo
                        name={request.dAppInfo?.name}
                        description={request.dAppInfo?.description}
                        url={request.dAppInfo?.url}
                        iconUrl={request.dAppInfo?.iconUrl}
                    />

                    {(request.preview.permissions || []).length > 0 && (
                        <View style={styles.permissionsSection}>
                            <SectionTitle>Requested Permissions</SectionTitle>

                            {request.preview.permissions?.map((permission, index) => (
                                <PermissionItem
                                    key={index}
                                    title={permission.title}
                                    description={permission.description}
                                />
                            ))}
                        </View>
                    )}

                    {selectedWallet && (
                        <View style={styles.walletSection}>
                            <View style={styles.walletHeader}>
                                <SectionTitle>Wallet:</SectionTitle>

                                <ActiveTouchAction onPress={() => setShowWalletSelector(true)}>
                                    <AppText style={styles.changeWalletText} textType="caption1">
                                        Change wallet
                                    </AppText>
                                </ActiveTouchAction>
                            </View>

                            {selectedWallet && (
                                <WalletInfoBlock
                                    name={selectedWalletData?.name || 'Selected Wallet'}
                                    address={selectedWallet.getAddress()}
                                />
                            )}
                        </View>
                    )}

                    {error && <WarningBox variant="error">{error}</WarningBox>}

                    {isLedgerWallet && isLoading && (
                        <View style={styles.ledgerPrompt}>
                            <Ionicons name="hardware-chip-outline" size={24} color={theme.colors.accent.primary} />
                            <View style={styles.ledgerPromptText}>
                                <AppText style={styles.ledgerPromptTitle} textType="body1">
                                    Confirm on Ledger
                                </AppText>
                                <AppText style={styles.ledgerPromptHint}>
                                    Please confirm this connection on your Ledger device
                                </AppText>
                            </View>
                        </View>
                    )}

                    <WarningBox>
                        Only connect to trusted applications. This will give the dApp access to your wallet address and
                        allow it to request transactions.
                    </WarningBox>

                    <ActionButtons
                        primaryText={isLoading && isLedgerWallet ? 'Waiting for Ledger...' : 'Connect'}
                        onPrimaryPress={handleApprove}
                        onSecondaryPress={handleReject}
                        isLoading={isLoading}
                        isPrimaryDisabled={!selectedWallet}
                    />
                </View>
            </AppBottomSheet>

            <WalletSelectorModal
                isOpen={showWalletSelector}
                onClose={() => setShowWalletSelector(false)}
                wallets={availableWallets}
                selectedWallet={selectedWallet}
                onSelectWallet={setSelectedWallet}
                title="Select Wallet"
            />
        </>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        gap: sizes.space.vertical,
        paddingBottom: sizes.space.vertical,
    },
    permissionsSection: {
        gap: sizes.space.vertical / 2,
        marginTop: sizes.space.vertical / 2,
    },
    walletSection: {
        marginTop: sizes.space.vertical / 2,
        gap: sizes.space.vertical / 2,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    changeWalletText: {
        color: colors.accent.primary,
        marginBottom: sizes.space.vertical / 2,
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
