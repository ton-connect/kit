/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction, type ActiveTouchActionProps } from '../active-touch-action';

export interface Props extends ActiveTouchActionProps {
    onClose?: () => void;
}

export const ScreenHeaderCloseButton: FC<Props> = ({ style, onClose, ...props }) => {
    const { theme } = useUnistyles();

    return (
        <ActiveTouchAction onPress={onClose} style={[styles.closeButton, style]} {...props}>
            <Ionicons color={theme.colors.text.default} name="close-outline" size={24} />
        </ActiveTouchAction>
    );
};

const styles = StyleSheet.create(() => ({
    closeButton: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
}));
