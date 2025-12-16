/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useContext } from 'react';
import type { FC } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../app-text';
import type { AppTextProps } from '../app-text';
import { AppButtonContext } from './context';

export const ButtonText: FC<AppTextProps> = ({ style, children, ...props }) => {
    const { disabled, colorScheme, variant } = useContext(AppButtonContext);

    styles.useVariants({ colorScheme });

    return (
        <AppText
            style={[styles.text, disabled && styles.disabledText, style as AppTextProps['style']]}
            textType={variant === 'standard' ? 'body1' : 'caption1'}
            {...props}
        >
            {children}
        </AppText>
    );
};

const styles = StyleSheet.create(({ colors }) => ({
    text: {
        variants: {
            colorScheme: {
                primary: {
                    color: colors.buttonPrimary.color,
                },
                secondary: {
                    color: colors.buttonSecondary.color,
                },
                action: {
                    color: colors.buttonAction.color,
                },
            },
        },
    },

    disabledText: {
        variants: {
            colorScheme: {
                primary: {
                    color: colors.buttonPrimary.colorDisabled,
                },
                secondary: {
                    color: colors.buttonSecondary.colorDisabled,
                },
                action: {
                    color: colors.buttonAction.colorDisabled,
                },
            },
        },
    },
}));
