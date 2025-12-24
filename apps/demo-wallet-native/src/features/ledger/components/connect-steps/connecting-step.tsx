/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { LoaderCircle } from '@/core/components/loader-circle';

export const ConnectingStep: FC = () => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.loadingContainer}>
            <LoaderCircle size={60} color={theme.colors.accent.primary} />
            <AppText style={styles.loadingText}>Creating wallet...</AppText>
            <AppText style={styles.loadingHint}>Please confirm on your Ledger device if prompted</AppText>
        </View>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: sizes.space.vertical,
        paddingVertical: sizes.space.vertical * 4,
    },
    loadingText: {
        color: colors.text.highlight,
        fontWeight: '500',
        fontSize: 16,
    },
    loadingHint: {
        color: colors.text.secondary,
        textAlign: 'center',
        fontSize: 14,
    },
}));
