/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { InfoBlock } from '@/core/components/info-block';

export const TransactionEmptyState: FC = () => {
    const { theme } = useUnistyles();

    return (
        <InfoBlock.Container style={styles.container}>
            <InfoBlock.IconWrapper>
                <InfoBlock.Icon color={theme.colors.text.inverted} name="reader" withWrapper />
            </InfoBlock.IconWrapper>

            <InfoBlock.Title>No transactions yet</InfoBlock.Title>
            <InfoBlock.Subtitle style={styles.subtitle}>
                You haven't made any transactions so far. Once you do, they'll appear here.
            </InfoBlock.Subtitle>
        </InfoBlock.Container>
    );
};

const styles = StyleSheet.create(() => ({
    container: {
        paddingVertical: 60,
    },
    subtitle: {
        marginBottom: 0,
        maxWidth: 'auto',
    },
}));
