/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Event, Action } from '@ton/walletkit';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { type FC, memo } from 'react';
import { Image, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { Column, Row } from '@/core/components/grid';

interface TransactionEventRowProps {
    event: Event;
    myAddress: string;
    onPress?: () => void;
    style?: ViewProps['style'];
}

export const TransactionEventRow: FC<TransactionEventRowProps> = memo(({ event, myAddress, onPress, style }) => {
    const { theme } = useUnistyles();

    // Get the most relevant action from the event
    const getRelevantAction = (): Action | null => {
        if (!event.actions || event.actions.length === 0) {
            return null;
        }

        // Find action that involves the user's address, or fallback to first action
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

    // Determine if this is an outgoing action by checking if myAddress is the first account (sender)
    const isOutgoing = accounts.length > 0 && accounts[0]?.address === myAddress;
    const isFailed = status === 'failure';

    // Determine icon and colors based on action type and status
    const getIconAndColor = () => {
        if (isFailed) {
            return {
                bgColor: theme.colors.error.foreground,
                iconColor: theme.colors.error.default,
                iconName: 'close-outline' as const,
            };
        }

        if (isOutgoing) {
            return {
                bgColor: theme.colors.background.block,
                iconColor: theme.colors.error.default,
                iconName: 'arrow-up-outline' as const,
            };
        }

        return {
            bgColor: theme.colors.background.block,
            iconColor: theme.colors.success.default,
            iconName: 'arrow-down-outline' as const,
        };
    };

    const { bgColor, iconColor, iconName } = getIconAndColor();
    const valueColor = isFailed || isOutgoing ? theme.colors.error.default : theme.colors.success.default;

    return (
        <ActiveTouchAction disabled={!onPress} onPress={onPress} scaling={0.98}>
            <Block style={[styles.container, style]}>
                <Row style={styles.leftSide}>
                    <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                        <Ionicons color={iconColor} name={iconName} size={18} />
                    </View>

                    <Column style={styles.typeColumn}>
                        <AppText style={styles.title} textType="body1" numberOfLines={2}>
                            {description}
                        </AppText>
                    </Column>
                </Row>

                <Column style={styles.rightSide}>
                    <Row style={styles.valueRow}>
                        {valueImage && (
                            <Image source={{ uri: valueImage }} style={styles.valueImage} resizeMode="cover" />
                        )}
                        <AppText style={[styles.value, { color: valueColor }]} textType="body1">
                            {!isFailed && (isOutgoing ? '-' : '+')}
                            {value}
                        </AppText>
                    </Row>

                    <AppText
                        style={[styles.timestamp, status !== 'success' && { color: theme.colors.error.default }]}
                        textType="caption2"
                    >
                        {status === 'success' ? dayjs(event.timestamp * 1000).format('DD MMM, HH:mm') : 'Failed'}
                    </AppText>
                </Column>
            </Block>
        </ActiveTouchAction>
    );
});

TransactionEventRow.displayName = 'TransactionEventRow';

const styles = StyleSheet.create(({ colors }) => ({
    container: {
        minHeight: 70,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingVertical: 10,
    },
    leftSide: {
        flex: 1,
        maxWidth: '55%',
        marginRight: 6,
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    typeColumn: {
        flex: 1,
    },
    rightSide: {
        flex: 1,
        maxWidth: '45%',
        alignItems: 'flex-end',
    },
    title: {
        color: colors.text.highlight,
    },
    valueRow: {
        alignItems: 'center',
        gap: 6,
    },
    valueImage: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    value: {
        textAlign: 'right',
    },
    timestamp: {
        color: colors.text.secondary,
        textAlign: 'right',
        marginTop: 2,
    },
}));
