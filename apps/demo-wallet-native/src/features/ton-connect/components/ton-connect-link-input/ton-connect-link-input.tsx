/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { FC } from 'react';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';

interface TonConnectLinkInputProps {
    value: string;
    onChangeText: (text: string) => void;
    label?: string;
    placeholder?: string;
}

export const TonConnectLinkInput: FC<TonConnectLinkInputProps> = ({
    value,
    onChangeText,
    label = 'Paste TON Connect Link',
    placeholder = 'tc://... or ton://... or https://...',
}) => {
    const { theme } = useUnistyles();

    const handlePasteFromClipboard = useCallback(async () => {
        try {
            const text = await Clipboard.getStringAsync();
            if (text) {
                onChangeText(text);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to paste from clipboard:', error);
        }
    }, [onChangeText]);

    return (
        <View style={styles.container}>
            <AppText style={styles.label} textType="caption1">
                {label}
            </AppText>

            <View style={styles.inputContainer}>
                <AppInput
                    testID="tonconnect-url"
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.text.secondary}
                    value={value}
                    onChangeText={onChangeText}
                    multiline
                    numberOfLines={3}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <ActiveTouchAction onPress={handlePasteFromClipboard} style={styles.pasteButton} testID="paste-button">
                    <Ionicons name="clipboard-outline" size={20} color={theme.colors.accent.primary} />
                </ActiveTouchAction>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        gap: sizes.space.vertical / 2,
    },
    label: {
        color: colors.text.highlight,
        textAlign: 'center',
        marginBottom: sizes.space.vertical / 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    input: {
        flex: 1,
        padding: sizes.space.vertical,
        paddingHorizontal: sizes.space.horizontal / 2,
        color: colors.text.default,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pasteButton: {
        paddingVertical: sizes.space.vertical,
        paddingHorizontal: sizes.space.horizontal / 2,
    },
}));
