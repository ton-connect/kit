/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventConnectRequest, Wallet } from '@ton/walletkit';
import { useWallet } from '@ton/demo-core';
import type { SavedWallet } from '@ton/demo-core';
import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DAppInfo } from '../dapp-info';
import { PermissionItem } from '../permission-item';
import { SectionTitle } from '../section-title';
import { ActionButtons } from '../action-buttons';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { AppText } from '@/core/components/app-text';
import { WarningBox } from '@/core/components/warning-box';
import { WalletInfoBlock, WalletSelectorModal } from '@/features/wallets';

interface ConnectRequestModalProps {
    request: EventConnectRequest;
    isOpen: boolean;
    onApprove: (selectedWallet: Wallet) => void;
    onReject: (reason?: string) => void;
}

export const ConnectRequestModal: FC<ConnectRequestModalProps> = ({ request, isOpen, onApprove, onReject }) => {
    const { savedWallets, getAvailableWallets } = useWallet();

    const [availableWallets, setAvailableWallets] = useState<Wallet[]>(getAvailableWallets());
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(availableWallets[0] || null);
    const [isLoading, setIsLoading] = useState(false);
    const [showWalletSelector, setShowWalletSelector] = useState(false);

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

    const walletDataMap = useMemo(() => {
        const map = new Map<string, SavedWallet>();
        savedWallets.forEach((savedWallet) => {
            map.set(savedWallet.address, savedWallet);
        });
        return map;
    }, [savedWallets]);

    const handleApprove = async () => {
        if (!selectedWallet) return;

        setIsLoading(true);
        try {
            await onApprove(selectedWallet);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to approve connection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the connection');
    };

    const selectedWalletData = selectedWallet ? walletDataMap.get(selectedWallet.getAddress()) : undefined;

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

                    <WarningBox>
                        Only connect to trusted applications. This will give the dApp access to your wallet address and
                        allow it to request transactions.
                    </WarningBox>

                    <ActionButtons
                        primaryText="Connect"
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
}));
