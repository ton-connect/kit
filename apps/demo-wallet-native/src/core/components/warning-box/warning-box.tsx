/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

type WarningBoxVariant = 'warning' | 'error' | 'info';

interface WarningBoxProps {
    children: ReactNode;
    variant?: WarningBoxVariant;
}

export const WarningBox: FC<WarningBoxProps> = ({ children, variant = 'warning' }) => {
    const { theme } = useUnistyles();

    const colors = useMemo(() => {
        switch (variant) {
            case 'error':
                return {
                    background: theme.colors.status.errorBackground,
                    text: theme.colors.status.error,
                };
            case 'info':
                return {
                    background: theme.colors.background.secondary,
                    text: theme.colors.text.secondary,
                };
            case 'warning':
            default:
                return {
                    background: theme.colors.status.warningBackground,
                    text: theme.colors.status.warning,
                };
        }
    }, [theme]);

    return (
        <Block style={[styles.container, { backgroundColor: colors.background }]}>
            <AppText style={[styles.text, { color: colors.text }]} textType="caption1">
                {children}
            </AppText>
        </Block>
    );
};

const styles = StyleSheet.create(({ sizes }) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: sizes.space.horizontal,
        paddingVertical: sizes.space.vertical * 2,
    },
    text: {
        flex: 1,
    },
}));
