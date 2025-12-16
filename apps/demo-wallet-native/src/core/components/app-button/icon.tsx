/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { useContext, useMemo } from 'react';
import type { FC } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButtonContext } from './context';

import type { PropsOf } from '@/core/utils/component-props';

export interface Props extends PropsOf<typeof Ionicons> {
    position?: 'left' | 'right';
}

export const ButtonIcon: FC<Props> = ({ style, position = 'left', children, ...props }) => {
    const { disabled, colorScheme, variant } = useContext(AppButtonContext);

    const { theme } = useUnistyles();
    styles.useVariants({ position });

    const iconColor = useMemo(() => {
        if (colorScheme === 'primary') {
            return disabled ? theme.colors.buttonPrimary.colorDisabled : theme.colors.buttonPrimary.color;
        }

        return disabled ? theme.colors.buttonSecondary.colorDisabled : theme.colors.buttonSecondary.color;
    }, [theme, colorScheme, disabled]);

    return <Ionicons color={iconColor} size={variant === 'small' ? 18 : 24} style={[styles.icon, style]} {...props} />;
};

const styles = StyleSheet.create(() => ({
    icon: {
        variants: {
            position: {
                left: {
                    marginRight: 5,
                },
                right: {
                    marginLeft: 5,
                },
            },
        },
    },
}));
