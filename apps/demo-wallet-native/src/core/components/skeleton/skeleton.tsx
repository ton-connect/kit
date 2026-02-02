/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { DimensionValue, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
    animate?: boolean;
}

export const Skeleton: FC<SkeletonProps> = ({ width, height, borderRadius = 4, style, animate = true }) => {
    const { theme } = useUnistyles();
    const opacity = useSharedValue(0.3);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: animate
            ? withRepeat(withTiming(opacity.value === 0.3 ? 0.7 : 0.3, { duration: 1000 }), -1, true)
            : 0.3,
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.colors.text.default,
                },
                animatedStyle,
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create(() => ({
    skeleton: {
        overflow: 'hidden',
    },
}));
