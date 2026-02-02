/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/core/components/app-text';

interface SuccessViewProps {
    title?: string;
    subtitle?: string;
}

export const SuccessView: FC<SuccessViewProps> = ({ title = 'Success!', subtitle }) => {
    const { theme } = useUnistyles();

    return (
        <Animated.View entering={ZoomIn.duration(300)} style={styles.container}>
            <View style={styles.icon}>
                <Ionicons name="checkmark" size={48} color={theme.colors.status.success} />
            </View>
            <AppText style={styles.title} textType="h2">
                {title}
            </AppText>
            {subtitle && (
                <AppText style={styles.subtitle} textType="body1">
                    {subtitle}
                </AppText>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: sizes.space.vertical * 3,
        gap: sizes.space.vertical,
    },
    icon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.status.successBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: colors.status.success,
    },
    subtitle: {
        color: colors.text.secondary,
    },
}));
