/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { Linking } from 'react-native';
import type { PressableProps, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ActiveTouchAction } from '../active-touch-action';
import { AppButtonContext } from './context';
import type { AppButtonColorScheme, AppButtonVariant } from './context';

export interface AppButtonContainerProps extends PressableProps {
    variant?: AppButtonVariant;
    colorScheme?: AppButtonColorScheme;
    href?: string;
    onPress?: () => Promise<void> | void;
    disabled?: boolean;
}

export const ButtonContainer: FC<PropsWithChildren & AppButtonContainerProps> = ({
    style,
    children,
    onPress,
    href,
    colorScheme = 'primary',
    variant = 'standard',
    disabled = false,
}) => {
    styles.useVariants({ variant, colorScheme });

    const handlePress = useCallback(async (): Promise<void> => {
        if (onPress) {
            void impactAsync(ImpactFeedbackStyle.Light);
            await onPress();
        }

        if (href) {
            void Linking.openURL(href);
        }
    }, [onPress, href]);

    const context = useMemo(() => ({ variant, disabled, colorScheme }), [variant, disabled, colorScheme]);

    return (
        <AppButtonContext.Provider value={context}>
            <ActiveTouchAction
                disabled={disabled}
                onPress={handlePress}
                style={[styles.button, disabled && styles.disabledButton, style as ViewStyle]}
            >
                {children}
            </ActiveTouchAction>
        </AppButtonContext.Provider>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: sizes.borderRadius.xl,

        variants: {
            variant: {
                input: {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                },

                small: {
                    paddingVertical: 12,
                    paddingHorizontal: 25,
                },

                standard: {
                    width: '100%',
                    maxWidth: 250,
                    marginHorizontal: 'auto',
                    paddingVertical: 20,
                    paddingHorizontal: 25,
                },
            },

            colorScheme: {
                primary: {
                    backgroundColor: colors.buttonPrimary.background,
                },

                secondary: {
                    backgroundColor: colors.buttonSecondary.background,
                },

                action: {
                    backgroundColor: colors.buttonAction.background,
                },
            },
        },
    },

    disabledButton: {
        variants: {
            colorScheme: {
                primary: {
                    backgroundColor: colors.buttonPrimary.backgroundDisabled,
                },

                secondary: {
                    backgroundColor: colors.buttonSecondary.backgroundDisabled,
                },

                action: {
                    backgroundColor: colors.buttonAction.backgroundDisabled,
                },
            },
        },
    },
}));
