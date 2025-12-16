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

import { ActiveTouchAction } from '../active-touch-action';
import type { ActiveTouchActionProps } from '../active-touch-action';

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

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        width: '100%',
        position: 'relative',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: sizes.space.vertical,
    },
    backButton: {
        position: 'absolute',
        left: 1,
        top: 8,
    },
    title: {
        color: colors.text.highlight,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 6,
        right: 12,
    },
    cancelButton: {
        position: 'absolute',
        top: 3,
        right: 0,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    cancelButtonText: {
        color: colors.text.highlight,
    },
}));
