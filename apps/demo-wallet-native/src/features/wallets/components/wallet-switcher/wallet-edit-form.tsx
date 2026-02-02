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

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppInput } from '@/core/components/app-input';

interface WalletEditFormProps {
    value: string;
    onChangeText: (text: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const WalletEditForm: FC<WalletEditFormProps> = ({ value, onChangeText, onSave, onCancel }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            <AppInput
                textType="body1"
                onChangeText={onChangeText}
                placeholder="Wallet name"
                style={styles.input}
                value={value}
                autoFocus
            />

            <View style={styles.buttons}>
                <ActiveTouchAction onPress={onSave} style={styles.button}>
                    <Ionicons color={theme.colors.success.default} name="checkmark" size={16} />
                </ActiveTouchAction>

                <ActiveTouchAction onPress={onCancel} style={styles.button}>
                    <Ionicons color={theme.colors.text.secondary} name="close" size={16} />
                </ActiveTouchAction>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(({ colors }) => ({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        flex: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: colors.text.highlight,
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        padding: 6,
    },
}));
