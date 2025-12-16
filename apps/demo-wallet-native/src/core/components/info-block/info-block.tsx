/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../app-text';
import type { AppTextProps } from '../app-text';
import { Block } from '../block';
import { getIconName } from './utils';

import type { PropsOf } from '@/core/utils/component-props';

export interface StatusIconProps extends Omit<PropsOf<typeof Ionicons>, 'name'> {
    status: 'processing' | 'success' | 'error';
}

export const InfoContainer: FC<ViewProps> = ({ style, ...props }) => {
    return <Block style={[styles.container, style]} {...props} />;
};

export const InfoIcon: FC<PropsOf<typeof Ionicons> & { withWrapper?: boolean }> = ({
    style,
    withWrapper,
    ...props
}) => {
    return <Ionicons size={withWrapper ? 23 : 35} style={[!withWrapper && styles.icon, style]} {...props} />;
};

export const InfoIconWrapper: FC<ViewProps> = ({ style, ...props }) => {
    return <View style={[styles.iconWrapper, style]} {...props} />;
};

export const StatusIcon: FC<StatusIconProps> = ({ status, ...props }) => {
    const { theme } = useUnistyles();

    const iconColor = useMemo(() => {
        switch (status) {
            case 'success':
                return theme.colors.success.default;
            case 'error':
                return theme.colors.error.default;
            default:
                return theme.colors.text.secondary;
        }
    }, [theme, status]);

    return <InfoIcon color={iconColor} name={getIconName(status)} {...props} />;
};

export const InfoTitle: FC<AppTextProps> = ({ style, ...props }) => {
    return <AppText style={[styles.title, style]} textType="h3" {...props} />;
};

export const InfoSubtitle: FC<AppTextProps> = ({ style, ...props }) => {
    return <AppText style={[styles.subtitle, style]} textType="body2" {...props} />;
};

export const InfoAdditionalText: FC<AppTextProps> = ({ style, ...props }) => {
    return <AppText style={[styles.bottomText, style]} {...props} />;
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        marginBottom: sizes.space.vertical,
    },
    title: {
        color: colors.text.highlight,
        marginBottom: sizes.space.vertical,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: sizes.space.vertical * 1.5,
        color: colors.text.secondary,
    },
    bottomText: {
        color: colors.text.secondary,
    },
    bottomTextAmount: {
        color: colors.text.highlight,
    },
    iconWrapper: {
        width: 35,
        height: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: sizes.borderRadius.rounded,
        backgroundColor: colors.text.secondary,
        marginBottom: sizes.space.vertical * 1.5,
    },
}));
