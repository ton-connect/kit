/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EventTransactionRequest } from '@ton/walletkit';
import { type FC, useState, useMemo, useEffect } from 'react';
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
import { WarningBox } from '@/core/components/warning-box';
import { WalletInfoBlock } from '@/features/wallets';

interface TransactionRequestModalProps {
    request: EventTransactionRequest;
    isOpen: boolean;
    onApprove: () => void;
    onReject: (reason?: string) => void;
}

export const TransactionRequestModal: FC<TransactionRequestModalProps> = ({ request, isOpen, onApprove, onReject }) => {
    const { savedWallets } = useWallet();
    const walletKit = useWalletKit();

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
            console.error('Failed to approve transaction:', error);
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

                {request.preview.result === 'success' && currentWallet && walletKit && (
                    <View style={styles.moneyFlowSection}>
                        <SectionTitle>Money Flow</SectionTitle>

                        {request.preview.moneyFlow.outputs === '0' &&
                        request.preview.moneyFlow.inputs === '0' &&
                        request.preview.moneyFlow.ourTransfers.length === 0 ? (
                            <View style={styles.noTransfers}>
                                <AppText style={styles.noTransfersText} textType="body1">
                                    This transaction doesn't involve any token transfers
                                </AppText>
                            </View>
                        ) : (
                            <View style={styles.transfersList}>
                                {request.preview.moneyFlow.ourTransfers.map((transfer, index) => (
                                    <JettonFlowItem
                                        key={index}
                                        jettonAddress={
                                            transfer.type === 'jetton' ? transfer.jetton : transfer.type.toUpperCase()
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

                {request.preview.result === 'error' && (
                    <WarningBox variant="error">Error: {request.preview.emulationError.message}</WarningBox>
                )}

                <WarningBox variant="error">
                    Warning: This transaction will be irreversible. Only approve if you trust the requesting dApp and
                    understand the transaction details.
                </WarningBox>

                <ActionButtons
                    primaryText={isLoading ? 'Signing...' : 'Approve & Sign'}
                    onPrimaryPress={handleApprove}
                    onSecondaryPress={handleReject}
                    isLoading={isLoading}
                    primaryTestID="send-transaction-approve"
                    secondaryTestID="send-transaction-reject"
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
