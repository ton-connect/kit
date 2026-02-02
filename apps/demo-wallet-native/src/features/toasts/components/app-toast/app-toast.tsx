/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import type { FC } from 'react';
import { Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { AppToastConfigParams, AppToastType } from '../../types/toasts';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';
import { Column } from '@/core/components/grid';
import { LoaderCircle } from '@/core/components/loader-circle';

const IconByType: FC<{ type?: AppToastType | string }> = ({ type }) => {
    const { theme } = useUnistyles();

    switch (type) {
        case 'loading':
            return <LoaderCircle size={24} />;
        case 'success':
            return <Ionicons color={theme.colors.success.default} name="checkmark-circle-outline" size={24} />;
        case 'error':
            return <Ionicons color={theme.colors.error.default} name="alert-circle-outline" size={24} />;
        case 'info':
            return <Ionicons color={theme.colors.text.highlight} name="information-circle-outline" size={24} />;
        default:
            return null;
    }
};

export const AppToast = ({ text1, text2, onPress, type, props }: AppToastConfigParams): React.JSX.Element => {
    const handlePress = (): void => {
        if (onPress) {
            onPress();
        }

        Toast.hide();
    };

    return (
        <ActiveTouchAction disabled={!onPress} onPress={handlePress} style={styles.container}>
            <IconByType type={type} />
            <Column style={styles.content}>
                <AppText style={styles.text}>{text1}</AppText>
                {text2 && (
                    <AppText style={styles.subtitle} textType="caption1">
                        {text2}
                        {props.ticker && (
                            <AppText style={styles.ticker} textType="caption1">
                                {' '}
                                {props.ticker}
                            </AppText>
                        )}
                    </AppText>
                )}
            </Column>
        </ActiveTouchAction>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        maxWidth: Dimensions.get('window').width - sizes.page.paddingHorizontal * 2,
        height: 60,
        paddingHorizontal: 25,
        backgroundColor: colors.background.toast,
        borderRadius: sizes.borderRadius.lg,
        gap: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,

        elevation: 20,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    content: {},
    text: {
        color: colors.text.secondary,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 1,
        color: colors.text.highlight,
        textAlign: 'center',
    },
    ticker: {
        color: colors.text.secondary,
    },
}));
