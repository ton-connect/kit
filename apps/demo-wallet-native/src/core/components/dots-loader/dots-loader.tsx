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
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface DotsLoaderProps {
    dots?: number;
    size?: number;
    bounceHeight?: number;
    distance?: number;
    color?: string;
}

interface DotElementProps extends DotsLoaderProps {
    index: number;
}

const DotElement: FC<DotElementProps> = ({ size = 10, index, bounceHeight, ...props }) => {
    const { theme } = useUnistyles();
    const shared = useSharedValue(0);

    useEffect(() => {
        shared.value = withSequence(
            withDelay(
                index * 100,
                withRepeat(
                    withTiming(bounceHeight || 10, {
                        duration: 600,
                        easing: Easing.bezier(0.41, -0.15, 0.56, 1.21),
                    }),
                    -1,
                    true,
                ),
            ),
        );

        return (): void => cancelAnimation(shared);
    }, [shared, bounceHeight, index]);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: shared.value }],
    }));

    return (
        <Animated.View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size,
                    marginRight: props.distance || 3,
                    backgroundColor: props.color || theme.colors.accent.primary,
                },
                style,
            ]}
        />
    );
};

export const DotsLoader: FC<DotsLoaderProps> = ({ dots = 3, ...props }) => {
    const dotAnimations = new Array(dots).fill(0).map((_, i) => i);

    return (
        <View style={styles.loading}>
            {dotAnimations.map((i) => (
                <DotElement {...props} index={i} key={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    loading: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
});
