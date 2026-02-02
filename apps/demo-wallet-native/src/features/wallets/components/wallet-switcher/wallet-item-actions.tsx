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

interface WalletItemActionsProps {
    onEdit: () => void;
    onRemove: () => void;
}

export const WalletItemActions: FC<WalletItemActionsProps> = ({ onRemove }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            {/*<ActiveTouchAction onPress={onEdit} style={styles.button}>*/}
            {/*    <Ionicons color={theme.colors.text.highlight} name="pencil-outline" size={18} />*/}
            {/*</ActiveTouchAction>*/}

            <ActiveTouchAction onPress={onRemove} style={styles.button}>
                <Ionicons color={theme.colors.error.default} name="trash-outline" size={18} />
            </ActiveTouchAction>
        </View>
    );
};

const styles = StyleSheet.create(() => ({
    container: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    button: {
        padding: 6,
    },
}));
