/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface Props {
    size?: number;
    style?: ViewStyle;
    color?: string;
    borderWidth?: number;
}

export const LoaderCircle: FC<Props> = ({ size = 100, borderWidth, style, color }) => {
    const { theme } = useUnistyles();

    const rotation = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(() => {
        return { transform: [{ rotateZ: `${rotation.value}deg` }] };
    });

    useEffect(() => {
        rotation.value = withRepeat(withTiming(720, { duration: 2100, easing: Easing.elastic(1.2) }), 0);

        return (): void => cancelAnimation(rotation);
    }, [rotation]);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.wrapper,
                    animatedStyles,
                    { borderTopColor: color || theme.colors.accent.primary },
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: borderWidth || size * 0.1,
                    },
                    style,
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create(() => ({
    container: {
        padding: 5,
    },
    wrapper: {
        borderWidth: 7,
        borderRightColor: 'rgba(0,0,0,0.02)',
        borderLeftColor: 'rgba(0,0,0,0.02)',
        borderBottomColor: 'rgba(0,0,0,0.02)',
    },
}));
