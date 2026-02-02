/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';

interface ScanningIndicatorProps {
    isScanning: boolean;
}

export const ScanningIndicator: FC<ScanningIndicatorProps> = ({ isScanning }) => {
    const { theme } = useUnistyles();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (isScanning) {
            scale.value = withRepeat(withTiming(1.3, { duration: 1000, easing: Easing.ease }), -1, true);
            opacity.value = withRepeat(withTiming(0.3, { duration: 1000, easing: Easing.ease }), -1, true);
        } else {
            cancelAnimation(scale);
            cancelAnimation(opacity);
            scale.value = 1;
            opacity.value = 1;
        }

        return () => {
            cancelAnimation(scale);
            cancelAnimation(opacity);
        };
    }, [isScanning, scale, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Animated.View
                    style={[styles.pulse, { backgroundColor: theme.colors.accent.primary }, animatedStyle]}
                />
                <View style={[styles.iconInner, { backgroundColor: theme.colors.background.main }]}>
                    <Ionicons name="bluetooth" size={32} color={theme.colors.accent.primary} />
                </View>
            </View>
            <AppText style={styles.text}>{isScanning ? 'Searching for devices...' : 'Ready to scan'}</AppText>
        </View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        alignItems: 'center',
        gap: sizes.space.vertical * 1.5,
        paddingVertical: sizes.space.vertical * 2,
    },
    iconContainer: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    iconInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: colors.text.secondary,
        textAlign: 'center',
    },
}));
