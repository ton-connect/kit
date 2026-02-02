/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

interface InstructionItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
}

const InstructionItem: FC<InstructionItemProps> = ({ icon, text }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.instructionItem}>
            <Ionicons name={icon} size={20} color={theme.colors.accent.primary} />
            <AppText style={styles.instructionText}>{text}</AppText>
        </View>
    );
};

export const LedgerInstructions: FC = () => {
    return (
        <Block style={styles.container}>
            <AppText style={styles.title}>Before you start</AppText>
            <View style={styles.instructions}>
                <InstructionItem icon="bluetooth" text="Enable Bluetooth on your phone" />
                <InstructionItem icon="power" text="Turn on your Ledger device" />
                <InstructionItem icon="lock-open-outline" text="Unlock it with your PIN" />
                <InstructionItem icon="apps-outline" text="Open the TON app on Ledger" />
            </View>
        </Block>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        padding: sizes.space.horizontal,
        gap: sizes.space.vertical,
    },
    title: {
        color: colors.text.highlight,
        fontWeight: '600',
        fontSize: 14,
    },
    instructions: {
        gap: sizes.space.vertical,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal,
    },
    instructionText: {
        color: colors.text.secondary,
        flex: 1,
    },
}));
