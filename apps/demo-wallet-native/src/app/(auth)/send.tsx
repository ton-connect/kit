/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons, AntDesign } from '@expo/vector-icons';
import { Address } from '@ton/ton';
import type { Jetton, TONTransferRequest } from '@ton/walletkit';
import { router } from 'expo-router';
import { useState } from 'react';
import type { FC } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useWallet, useWalletKit } from '@demo/core';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AmountInput } from '@/core/components/amount-input';
import { AppButton } from '@/core/components/app-button';
import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';
import { AppKeyboardAwareScrollView } from '@/core/components/keyboard-aware-scroll-view';
import { QrScanner } from '@/core/components/qr-scanner';
import { ScreenHeader } from '@/core/components/screen-header';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { TokenListSheet, TokenSelector } from '@/features/send';
import { fromMinorUnit, toMinorUnit } from '@/core/utils/amount/minor-unit';
import { useFormattedJetton } from '@/core/hooks/use-formatted-jetton';
import { getLedgerErrorMessage } from '@/features/ledger';

interface SelectedToken {
    type: 'TON' | 'JETTON';
    data?: Jetton;
}

const SendScreen: FC = () => {
    const [showTokenSelector, setShowTokenSelector] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedToken, setSelectedToken] = useState<SelectedToken>({ type: 'TON' });
    const [isScannerVisible, setIsScannerVisible] = useState(false);

    const { theme } = useUnistyles();
    const selectedJettonInfo = useFormattedJetton(selectedToken?.data);

    const walletKit = useWalletKit();
    const { balance, currentWallet } = useWallet();

    const isLedgerWallet = currentWallet?.walletType === 'ledger';

    const formatTonBalance = (bal: string): string => {
        return fromMinorUnit(bal || '0', 9).toString();
    };

    const getCurrentTokenBalance = (): string => {
        if (selectedToken.type === 'TON') {
            return formatTonBalance(balance || '0');
        } else if (selectedJettonInfo?.balance) {
            return selectedJettonInfo.balance;
        }
        return '0';
    };

    const getTokenSymbol = (): string => {
        if (selectedToken.type === 'TON') {
            return 'TON';
        } else if (selectedJettonInfo?.symbol) {
            return selectedJettonInfo.symbol;
        }
        return '';
    };

    const handleSend = async () => {
        if (!recipient.trim()) {
            Alert.alert('Error', 'Please enter recipient address');
            return;
        }

        if (!Address.isFriendly(recipient)) {
            Alert.alert('Error', 'Invalid address');
            return;
        }

        const inputAmount = parseFloat(amount);
        if (isNaN(inputAmount) || inputAmount <= 0) {
            Alert.alert('Error', 'Amount must be greater than 0');
            return;
        }

        const currentBalance = parseFloat(getCurrentTokenBalance());
        if (inputAmount > currentBalance) {
            Alert.alert('Error', 'Insufficient balance');
            return;
        }

        if (!currentWallet) {
            Alert.alert('Error', 'No wallet available');
            return;
        }

        setIsLoading(true);

        try {
            if (selectedToken.type === 'TON') {
                const nanoTonAmount = toMinorUnit(inputAmount, 9).toString();

                const tonTransferParams: TONTransferRequest = {
                    recipientAddress: recipient,
                    transferAmount: nanoTonAmount,
                };

                const result = await currentWallet.createTransferTonTransaction(tonTransferParams);

                if (walletKit) {
                    await walletKit.handleNewTransaction(currentWallet, result);
                }
            } else if (selectedToken.data) {
                if (!selectedJettonInfo?.decimals) {
                    Alert.alert('Error', 'Jetton decimals not found');
                    return;
                }

                const jettonAmount = toMinorUnit(inputAmount, selectedJettonInfo.decimals).toString();

                const jettonTransaction = await currentWallet.createTransferJettonTransaction({
                    recipientAddress: recipient,
                    jettonAddress: selectedToken.data.address,
                    transferAmount: jettonAmount,
                });

                if (walletKit) {
                    await walletKit.handleNewTransaction(currentWallet, jettonTransaction);
                }
            }

            router.back();
        } catch (err) {
            Alert.alert(
                'Error',
                isLedgerWallet ? getLedgerErrorMessage(err) : getErrorMessage(err, 'Failed to send transaction'),
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (text: string) => {
        setAmount(text.replace(',', '.'));
    };

    const handleSelectTon = () => {
        setSelectedToken({ type: 'TON' });
        setAmount('');
    };

    const handleSelectJetton = (jetton: Jetton) => {
        setSelectedToken({ type: 'JETTON', data: jetton });
        setAmount('');
    };

    const handleScannerOpen = () => {
        setIsScannerVisible(true);
    };

    const handleScannerClose = () => {
        setIsScannerVisible(false);
    };

    const handleScanRecipient = (data: string) => {
        if (!data) return;
        setRecipient(data.trim());
        handleScannerClose();
    };

    return (
        <AppKeyboardAwareScrollView contentContainerStyle={styles.containerContent} style={styles.container}>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton />
                </ScreenHeader.LeftSide>
                <ScreenHeader.Title>Send {getTokenSymbol()}</ScreenHeader.Title>
            </ScreenHeader.Container>

            <TokenSelector onSelectToken={() => setShowTokenSelector(true)} selectedToken={selectedToken} />

            <AmountInput.Container style={styles.amountInput}>
                <AmountInput.WithTicker amount={amount} onChangeAmount={handleAmountChange} ticker={getTokenSymbol()} />

                <AmountInput.Percents
                    amount={amount}
                    balance={getCurrentTokenBalance()}
                    onChangeAmount={handleAmountChange}
                />
            </AmountInput.Container>

            <View style={styles.addressInputContainer}>
                <AppInput
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect={false}
                    onChangeText={setRecipient}
                    placeholder="Recipient Address"
                    style={styles.addressInput}
                    value={recipient}
                />

                <ActiveTouchAction onPress={handleScannerOpen} style={styles.scanButton}>
                    <AntDesign name="scan" size={18} color={theme.colors.accent.primary} />
                </ActiveTouchAction>
            </View>

            {isLedgerWallet && isLoading && (
                <View style={styles.ledgerPrompt}>
                    <Ionicons name="hardware-chip-outline" size={24} color={theme.colors.accent.primary} />
                    <View style={styles.ledgerPromptText}>
                        <AppText style={styles.ledgerPromptTitle} textType="body1">
                            Confirm on Ledger
                        </AppText>
                        <AppText style={styles.ledgerPromptHint}>
                            Please review and confirm this transaction on your Ledger device
                        </AppText>
                    </View>
                </View>
            )}

            <AppButton.Container
                colorScheme="primary"
                disabled={isLoading || !recipient || !amount}
                onPress={handleSend}
            >
                <AppButton.Text>
                    {isLoading ? (isLedgerWallet ? 'Waiting for Ledger...' : 'Sending...') : 'Send'}
                </AppButton.Text>
            </AppButton.Container>

            <TokenListSheet
                isOpen={showTokenSelector}
                onClose={() => setShowTokenSelector(false)}
                onSelectTon={handleSelectTon}
                onSelectJetton={handleSelectJetton}
                selectedToken={selectedToken}
            />

            <QrScanner
                hint="Scan recipient TON address"
                isVisible={isScannerVisible}
                onClose={handleScannerClose}
                onScan={handleScanRecipient}
            />
        </AppKeyboardAwareScrollView>
    );
};

export default SendScreen;

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    container: {
        marginTop: runtime.insets.top,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        paddingHorizontal: sizes.page.paddingHorizontal,
    },
    containerContent: {
        paddingTop: sizes.page.paddingTop,
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    addressInputContainer: {
        flexDirection: 'row',
        gap: sizes.space.horizontal / 2,
        marginBottom: sizes.space.vertical * 2,
        backgroundColor: colors.background.block,
        borderRadius: sizes.borderRadius.md,
        paddingVertical: sizes.block.paddingVertical,
        paddingHorizontal: sizes.block.paddingHorizontal,
        borderColor: colors.navigation.default,
    },
    addressInput: {
        flex: 1,
        color: colors.text.highlight,
    },
    scanButton: {
        paddingHorizontal: sizes.space.horizontal / 2,
        paddingVertical: sizes.space.vertical / 2,
    },
    amountInput: {
        paddingVertical: sizes.space.vertical * 3,
        gap: sizes.space.vertical / 2,
        marginTop: sizes.space.vertical,
        marginBottom: sizes.space.vertical,
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
        marginBottom: sizes.space.vertical,
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
