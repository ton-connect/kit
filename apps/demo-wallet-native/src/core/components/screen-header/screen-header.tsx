/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import type { FC } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '../active-touch-action';
import { AppButton } from '../app-button';
import { AppText } from '../app-text';
import type { AppTextProps } from '../app-text';
import { BackButton } from '../back-button';
import { Row } from '../grid';

interface Props extends ViewProps {
    title: string;
    titleStyle?: AppTextProps['style'];
    isCancelButton?: boolean;
    isBackButton?: boolean;
    onClose?: () => void;
    onCustomCancel?: () => void;
    onCustomBack?: () => void;
}

export const ScreenHeader: FC<Props> = ({
    title,
    isBackButton,
    isCancelButton,
    style,
    titleStyle,
    onClose,
    onCustomCancel,
    ...props
}) => {
    const { theme } = useUnistyles();

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
        <Row style={[styles.container, style]} {...props}>
            {isBackButton && <BackButton style={styles.backButton} />}

            <AppText style={[styles.title, titleStyle]} textType="h3">
                {title}
            </AppText>

            {onClose && !isCancelButton && (
                <ActiveTouchAction onPress={onClose} style={styles.closeButton}>
                    <Ionicons color={theme.colors.text.default} name="close-outline" size={24} />
                </ActiveTouchAction>
            )}

            {isCancelButton && (
                <AppButton.Container
                    colorScheme="secondary"
                    onPress={handleCancel}
                    style={styles.cancelButton}
                    variant="small"
                >
                    <AppButton.Text textType="caption2">Cancel</AppButton.Text>
                </AppButton.Container>
            )}
        </Row>
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
