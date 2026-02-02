/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { router, useNavigation } from 'expo-router';
import type { FC } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppButton } from '../app-button';

export interface Props extends ViewProps {
    onCustomCancel?: () => void;
}

export const ScreenHeaderCancelButton: FC<Props> = ({ style, onCustomCancel, ...props }) => {
    const nav = useNavigation();

    const handleCancel = (): void => {
        if (onCustomCancel) {
            onCustomCancel();

            return;
        }

        if (router.canDismiss() && (nav.getState()?.routes?.length || 0) > 1) router.dismissAll();

        if (router.canGoBack()) router.back();
    };

    return (
        <AppButton.Container
            colorScheme="secondary"
            onPress={handleCancel}
            style={styles.cancelButton}
            variant="small"
            {...props}
        >
            <AppButton.Text textType="caption2">Cancel</AppButton.Text>
        </AppButton.Container>
    );
};

const styles = StyleSheet.create(({ colors }) => ({
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
