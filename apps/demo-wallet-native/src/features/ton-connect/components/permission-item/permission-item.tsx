/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

interface PermissionItemProps {
    title: string;
    description: string;
}

export const PermissionItem: FC<PermissionItemProps> = ({ title, description }) => {
    return (
        <Block style={styles.container}>
            <View style={styles.dot} />

            <View style={styles.content}>
                <AppText style={styles.title} textType="body1">
                    {title}
                </AppText>

                <AppText style={styles.description} textType="caption1">
                    {description}
                </AppText>
            </View>
        </Block>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
        paddingHorizontal: sizes.space.horizontal / 2,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: sizes.borderRadius.rounded,
        backgroundColor: colors.accent.primary,
    },
    content: {
        flex: 1,
        gap: 2,
    },
    title: {
        color: colors.text.highlight,
    },
    description: {
        color: colors.text.secondary,
    },
}));
