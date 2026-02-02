/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Modal, Platform, View } from 'react-native';
import type { ModalProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ModalToastProvider } from '@/features/toasts';

export const AppModal: FC<ModalProps> = ({ style, children, onRequestClose, ...props }) => {
    return (
        <Modal
            animationType="slide"
            onRequestClose={onRequestClose}
            presentationStyle={Platform.OS === 'ios' ? 'formSheet' : undefined}
            statusBarTranslucent
            {...props}
        >
            <View style={[styles.content, style]}>{children}</View>

            <ModalToastProvider />
        </Modal>
    );
};

const styles = StyleSheet.create(({ colors }, runtime) => ({
    content: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? runtime.insets.top : undefined,
        backgroundColor: colors.background.modal,
    },
}));
