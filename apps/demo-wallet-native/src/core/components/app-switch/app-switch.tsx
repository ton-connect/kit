/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LoaderCircle } from '@/core/components/loader-circle';

interface SwitchComponentType {
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    styleBoxContainer?: StyleProp<ViewStyle>;
    styleBox?: StyleProp<ViewStyle>;
    isLoading?: boolean;
}

const startPosition = 0;
const endPosition = 19;

/* https://github.com/dogukanyasarr/react-native-switch-component/blob/master/src/type.ts */
export const AppSwitch: FC<SwitchComponentType> = ({
    isActive,
    setIsActive,
    style,
    styleBoxContainer,
    styleBox,
    disabled,
    isLoading,
}) => {
    const { theme } = useUnistyles();
    styles.useVariants({ disabled: disabled || isLoading });

    const animation = useSharedValue(startPosition);
    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: animation.value }],
            backgroundColor: disabled
                ? theme.colors.switch.thumbDisabled
                : interpolateColor(
                      animation.value,
                      [startPosition, endPosition],
                      [theme.colors.switch.thumbOff, theme.colors.switch.thumbOn],
                  ),
        };
    });

    const handleChange = (): void => setIsActive(!isActive);

    const startAnimation = useCallback((): void => {
        if (isActive) {
            animation.value = withTiming(endPosition, { duration: 250 });
        } else {
            animation.value = withTiming(startPosition, { duration: 250 });
        }
    }, [isActive, animation]);

    useEffect(() => {
        startAnimation();
    }, [startAnimation]);

    return (
        <Pressable disabled={disabled || isLoading} onPress={handleChange} style={style}>
            <Animated.View style={[styles.boxContainer, styleBoxContainer]}>
                <Animated.View style={[styles.box, animatedIconStyle, styleBox]}>
                    {isLoading && <LoaderCircle borderWidth={2} color={theme.colors.text.default} size={18} />}
                </Animated.View>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create(({ colors }) => ({
    boxContainer: {
        width: 50,
        borderRadius: 50,
        paddingHorizontal: 2,
        height: 30,
        justifyContent: 'center',
        backgroundColor: colors.switch.background,
        borderColor: colors.switch.border,
        borderWidth: 1,

        variants: {
            disabled: {
                true: {
                    backgroundColor: colors.switch.backgroundDisabled,
                },
            },
        },
    },
    box: {
        width: 25,
        height: 25,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',

        variants: {
            disabled: {
                true: {
                    opacity: 0.5,
                },
            },
        },
    },
}));
