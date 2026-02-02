/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton } from '@/core/components/app-button';
import { InfoBlock } from '@/core/components/info-block';

interface TransactionErrorStateProps {
    error: string;
    onRetry?: () => void;
}

export const TransactionErrorState: FC<TransactionErrorStateProps> = ({ error, onRetry }) => {
    const { theme } = useUnistyles();

    return (
        <InfoBlock.Container style={styles.container}>
            <InfoBlock.IconWrapper>
                <InfoBlock.Icon color={theme.colors.error.foreground} name="alert-circle" withWrapper />
            </InfoBlock.IconWrapper>

            <InfoBlock.Title>Error Loading Transactions</InfoBlock.Title>
            <InfoBlock.Subtitle style={styles.subtitle}>{error}</InfoBlock.Subtitle>

            {onRetry && (
                <AppButton.Container onPress={onRetry} style={styles.button}>
                    <AppButton.Text>Try Again</AppButton.Text>
                </AppButton.Container>
            )}
        </InfoBlock.Container>
    );
};

const styles = StyleSheet.create(() => ({
    container: {
        paddingVertical: 60,
    },
    subtitle: {
        marginBottom: 20,
        maxWidth: 'auto',
    },
    button: {
        alignSelf: 'center',
        minWidth: 120,
    },
}));
