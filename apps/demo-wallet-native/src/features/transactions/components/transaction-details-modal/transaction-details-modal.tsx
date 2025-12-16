/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Event, Action } from '@ton/walletkit';
import type { FC } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { formatAddress } from '@ton/demo-core';
import * as Clipboard from 'expo-clipboard';
import dayjs from 'dayjs';

import { AppText } from '@/core/components/app-text';
import { AppModal } from '@/core/components/app-modal';
import { Block } from '@/core/components/block';
import { Row } from '@/core/components/grid';
import { useAppToasts } from '@/features/toasts';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { ScreenHeader } from '@/core/components/screen-header';
import { isOutgoingTx } from '@/features/transactions/utils';

interface TransactionDetailsModalProps {
    event: Event | null;
    myAddress: string;
    visible: boolean;
    onClose: () => void;
}

export const TransactionDetailsModal: FC<TransactionDetailsModalProps> = ({ event, myAddress, visible, onClose }) => {
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

    if (!event) {
        return null;
    }

    const getRelevantAction = (): Action | null => {
        if (!event.actions || event.actions.length === 0) {
            return null;
        }

        return (
            event.actions.find((a: Action) => a.simplePreview?.accounts?.some((acc) => acc.address === myAddress)) ||
            event.actions[0]
        );
    };

    const action = getRelevantAction();

    if (!action) {
        return null;
    }

    const { simplePreview, status } = action;
    const { description, value, accounts, valueImage } = simplePreview;

    const isOutgoing = isOutgoingTx(accounts, myAddress);
    const isFailed = status === 'failure';

    const getStatusColor = () => {
        if (isFailed) return theme.colors.error.default;
        return theme.colors.success.default;
    };

    const getStatusText = () => {
        if (isFailed) return 'Failed';
        return 'Confirmed';
    };

    const valueColor = isFailed || isOutgoing ? theme.colors.error.default : theme.colors.success.default;

    const counterpartyAddress = isOutgoing
        ? accounts.find((acc) => acc.address !== myAddress)?.address
        : accounts[0]?.address;

    const counterpartyName = isOutgoing ? accounts.find((acc) => acc.address !== myAddress)?.name : accounts[0]?.name;

    return (
        <AppModal visible={visible} onRequestClose={onClose}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <ScreenHeader.Container>
                    <ScreenHeader.Title>Transaction Details</ScreenHeader.Title>

                    <ScreenHeader.RightSide>
                        <ScreenHeader.CloseButton onClose={onClose} />
                    </ScreenHeader.RightSide>
                </ScreenHeader.Container>

                <Block style={styles.overviewBlock}>
                    <Row style={styles.overviewRow}>
                        {valueImage ? (
                            <Image source={{ uri: valueImage }} style={styles.tokenImage} resizeMode="cover" />
                        ) : (
                            <View
                                style={[
                                    styles.iconContainer,
                                    {
                                        backgroundColor: isOutgoing
                                            ? theme.colors.error.default + '20'
                                            : theme.colors.success.default + '20',
                                    },
                                ]}
                            >
                                <Ionicons
                                    color={isOutgoing ? theme.colors.error.default : theme.colors.success.default}
                                    name={isOutgoing ? 'arrow-up' : 'arrow-down'}
                                    size={24}
                                />
                            </View>
                        )}

                        <View style={styles.overviewInfo}>
                            <AppText style={styles.overviewTitle} textType="body1">
                                {isOutgoing ? 'Sent' : 'Received'}
                            </AppText>

                            <AppText style={styles.overviewDate}>
                                {dayjs(event.timestamp * 1000).format('DD MMM YYYY, HH:mm')}
                            </AppText>
                        </View>

                        <View style={styles.overviewValue}>
                            <Row style={styles.valueRow}>
                                {valueImage && (
                                    <Image source={{ uri: valueImage }} style={styles.valueImage} resizeMode="cover" />
                                )}
                                <AppText style={[styles.valueText, { color: valueColor }]} textType="body1">
                                    {!isFailed && (isOutgoing ? '-' : '+')}
                                    {value}
                                </AppText>
                            </Row>
                        </View>
                    </Row>
                </Block>

                {/* Description */}
                {description && (
                    <Block style={styles.block}>
                        <AppText style={styles.sectionLabel}>Description</AppText>
                        <AppText style={styles.sectionValue}>{description}</AppText>
                    </Block>
                )}

                {/* Transaction Information */}
                <Block style={styles.block}>
                    {/* Event ID / Hash */}
                    <View style={styles.section}>
                        <AppText style={styles.sectionLabel}>Transaction Hash</AppText>
                        <TouchableOpacity style={styles.addressRow} onPress={handleCopy(event.eventId)}>
                            <AppText style={styles.sectionValue}>{formatAddress(event.eventId, 8)}</AppText>
                            <Ionicons color={theme.colors.text.secondary} name="copy-outline" size={16} />
                        </TouchableOpacity>
                    </View>

                    {/* Counterparty Address */}
                    {counterpartyAddress && (
                        <View style={styles.section}>
                            <AppText style={styles.sectionLabel}>{isOutgoing ? 'To' : 'From'}</AppText>
                            <TouchableOpacity style={styles.addressRow} onPress={handleCopy(counterpartyAddress)}>
                                <AppText style={styles.sectionValue}>
                                    {counterpartyName || formatAddress(counterpartyAddress)}
                                </AppText>
                                <Ionicons color={theme.colors.text.secondary} name="copy-outline" size={16} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Account */}
                    <View style={styles.section}>
                        <AppText style={styles.sectionLabel}>Account</AppText>
                        <TouchableOpacity style={styles.addressRow} onPress={handleCopy(event.account.address)}>
                            <AppText style={styles.sectionValue}>
                                {event.account.name || formatAddress(event.account.address)}
                            </AppText>
                            <Ionicons color={theme.colors.text.secondary} name="copy-outline" size={16} />
                        </TouchableOpacity>
                    </View>

                    {/* Status */}
                    <View style={styles.section}>
                        <AppText style={styles.sectionLabel}>Status</AppText>
                        <AppText style={[styles.sectionValue, { color: getStatusColor() }]}>{getStatusText()}</AppText>
                    </View>
                </Block>

                {/* Actions */}
                {event.actions.length > 1 && (
                    <Block style={styles.block}>
                        <AppText style={styles.blockTitle}>Actions ({event.actions.length})</AppText>

                        {event.actions.map((act, index) => (
                            <View key={index} style={styles.actionItem}>
                                <View style={styles.actionHeader}>
                                    <AppText style={styles.actionType}>{act.type}</AppText>
                                    <AppText
                                        style={[
                                            styles.actionStatus,
                                            {
                                                color:
                                                    act.status === 'success'
                                                        ? theme.colors.success.default
                                                        : theme.colors.error.default,
                                            },
                                        ]}
                                    >
                                        {act.status}
                                    </AppText>
                                </View>
                                <AppText style={styles.actionDescription} numberOfLines={2}>
                                    {act.simplePreview.description}
                                </AppText>
                                {act.simplePreview.value && (
                                    <AppText style={styles.actionValue}>{act.simplePreview.value}</AppText>
                                )}
                            </View>
                        ))}
                    </Block>
                )}
            </ScrollView>
        </AppModal>
    );
};

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    contentContainer: {
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
        paddingVertical: sizes.block.paddingVertical,
        paddingHorizontal: sizes.page.paddingHorizontal,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        gap: sizes.space.vertical,
    },
    overviewBlock: {
        paddingVertical: sizes.block.paddingVertical,
    },
    overviewRow: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: sizes.space.horizontal / 2,
    },
    tokenImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: sizes.space.horizontal / 2,
    },
    overviewInfo: {
        flex: 1,
    },
    overviewTitle: {
        color: colors.text.highlight,
        fontWeight: '600',
    },
    overviewDate: {
        color: colors.text.secondary,
        fontSize: 14,
        marginTop: 2,
    },
    overviewValue: {
        alignItems: 'flex-end',
    },
    valueRow: {
        alignItems: 'center',
        gap: 6,
    },
    valueImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    valueText: {
        fontWeight: '600',
    },
    statusText: {
        fontSize: 12,
        marginTop: 2,
    },
    block: {
        paddingVertical: sizes.block.paddingVertical,
    },
    blockTitle: {
        color: colors.text.highlight,
        fontWeight: '600',
        marginBottom: sizes.space.vertical,
    },
    section: {
        marginBottom: sizes.space.vertical * 1.5,
    },
    sectionLabel: {
        color: colors.text.secondary,
        fontSize: 14,
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
    actionItem: {
        backgroundColor: colors.background.secondary,
        borderRadius: sizes.borderRadius.md,
        padding: sizes.space.horizontal,
        marginBottom: sizes.space.vertical,
    },
    actionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: sizes.space.vertical / 2,
    },
    actionType: {
        color: colors.text.highlight,
        fontWeight: '500',
    },
    actionStatus: {
        fontSize: 12,
        textTransform: 'capitalize',
    },
    actionDescription: {
        color: colors.text.secondary,
        fontSize: 14,
    },
    actionValue: {
        color: colors.text.highlight,
        fontSize: 14,
        marginTop: sizes.space.vertical / 2,
    },
}));
