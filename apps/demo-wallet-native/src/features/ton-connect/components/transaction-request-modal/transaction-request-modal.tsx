/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequestEvent } from '@ton/walletkit';
import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useWallet } from '@ton/demo-core';
import { useWalletKit } from '@ton/demo-core';

import { DAppInfo } from '../dapp-info';
import { JettonFlowItem } from '../jetton-flow-item';
import { SectionTitle } from '../section-title';
import { ActionButtons } from '../action-buttons';
import { SuccessView } from '../success-view';

import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { AppText } from '@/core/components/app-text';
import { AppButton } from '@/core/components/app-button';
import { WarningBox } from '@/core/components/warning-box';
import { WalletInfoBlock } from '@/features/wallets';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { useAppToasts } from '@/features/toasts';

interface TransactionRequestModalProps {
    request: TransactionRequestEvent;
    isOpen: boolean;
    onApprove: () => void;
    onReject: (reason?: string) => void;
}

export const TransactionRequestModal: FC<TransactionRequestModalProps> = ({ request, isOpen, onApprove, onReject }) => {
    const { savedWallets } = useWallet();
    const walletKit = useWalletKit();

    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    const { toast } = useAppToasts();

    const currentWallet = useMemo(() => {
        if (!request.walletAddress) return null;
        return savedWallets.find((wallet) => wallet.kitWalletId === request.walletId) || null;
    }, [savedWallets, request.walletAddress]);

    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
            setIsExpired(false);
        }
    }, [isOpen]);

    // Check every second if transaction has expired
    useEffect(() => {
        const checkExpiration = () => {
            const validUntil = request.request?.validUntil;
            if (validUntil) {
                const now = Math.floor(Date.now() / 1000);
                setIsExpired(validUntil < now);
            } else {
                setIsExpired(false);
            }
        };

        // Check immediately
        checkExpiration();

        // Set up interval to check every second
        const interval = setInterval(checkExpiration, 1000);

        return () => clearInterval(interval);
    }, [request.request?.validUntil]);

    const handleApprove = async () => {
        setIsLoading(true);

        try {
            await onApprove();
            setIsLoading(false);
            setShowSuccess(true);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to approve transaction:', error);
            toast({
                title: 'Failed to approve transaction',
                subtitle: (error as Error)?.message,
                type: 'error',
            });
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the transaction');
    };

    if (showSuccess) {
        return (
            <AppBottomSheet isOpened={isOpen} onClose={() => {}} isDisabledClose isScrollable={false}>
                <SuccessView subtitle="Transaction signed successfully" />
            </AppBottomSheet>
        );
    }

    return (
        <AppBottomSheet isOpened={isOpen} onClose={handleReject} title="Transaction Request" enableDynamicSizing>
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

                {isExpired && (
                    <WarningBox variant="warning">
                        This transaction request has expired and can no longer be signed. Please reject it and ask the
                        dApp to create a new request.
                    </WarningBox>
                )}

                {!isExpired && (
                    <>
                        {request.preview.data.result === 'success' && currentWallet && walletKit && (
                            <View style={styles.moneyFlowSection}>
                                <SectionTitle>Money Flow</SectionTitle>

                                {request.preview.data.moneyFlow?.outputs === '0' &&
                                request.preview.data.moneyFlow.inputs === '0' &&
                                request.preview.data.moneyFlow.ourTransfers.length === 0 ? (
                                    <View style={styles.noTransfers}>
                                        <AppText style={styles.noTransfersText} textType="body1">
                                            This transaction doesn't involve any token transfers
                                        </AppText>
                                    </View>
                                ) : (
                                    <View style={styles.transfersList}>
                                        {request.preview.data.moneyFlow?.ourTransfers.map((transfer, index) => (
                                            <JettonFlowItem
                                                key={index}
                                                jettonAddress={
                                                    transfer.assetType === 'jetton'
                                                        ? transfer.tokenAddress
                                                        : transfer.assetType.toUpperCase()
                                                }
                                                amount={transfer.amount}
                                                activeWallet={currentWallet}
                                                walletKit={walletKit}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {(request.preview.data.result === 'failure' || request.preview.data.error) && (
                            <WarningBox variant="error">Error: {getErrorMessage(request.preview.data)}</WarningBox>
                        )}

                        <WarningBox variant="error">
                            Warning: This transaction will be irreversible. Only approve if you trust the requesting
                            dApp and understand the transaction details.
                        </WarningBox>
                    </>
                )}

                {isExpired ? (
                    <AppButton.Container onPress={handleReject} colorScheme="secondary" disabled={isLoading}>
                        <AppButton.Text>Reject</AppButton.Text>
                    </AppButton.Container>
                ) : (
                    <ActionButtons
                        primaryText={isLoading ? 'Signing...' : 'Approve & Sign'}
                        onPrimaryPress={handleApprove}
                        onSecondaryPress={handleReject}
                        isLoading={isLoading}
                        isPrimaryDisabled={isLoading}
                    />
                )}
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
    moneyFlowSection: {
        gap: sizes.space.vertical / 2,
    },
    noTransfers: {
        padding: sizes.space.vertical / 2,
        backgroundColor: colors.background.secondary,
        borderRadius: 8,
    },
    noTransfersText: {
        color: colors.text.secondary,
        textAlign: 'center',
    },
    transfersList: {
        gap: sizes.space.vertical / 2,
    },
}));
