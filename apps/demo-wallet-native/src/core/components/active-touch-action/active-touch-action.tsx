/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, PropsWithChildren } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import type { StyleProp, TouchableOpacityProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface ActiveTouchActionProps extends PropsWithChildren {
    onPress?: (() => void) | (() => Promise<void>) | TouchableOpacityProps['onPress'];
    onLongPress?: () => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    scaling?: number;
    hitSlop?: number;
}

export const ActiveTouchAction: FC<ActiveTouchActionProps> = ({
    onPress,
    onLongPress,
    style,
    disabled,
    scaling = 0.96,
    children,
    hitSlop,
}) => {
    const pressed = useSharedValue(false);

    const onTouchIn = (): void => {
        pressed.value = true;
    };

    const onPressOut = (): void => {
        pressed.value = false;
    };

    const handleLongPress = (): void => {
        if (onLongPress) onLongPress();
    };

    const animatedStyles = useAnimatedStyle(() => ({
        transform: [{ scale: withTiming(pressed.value ? scaling : 1, { duration: 200 }) }],
    }));

    return (
        <TouchableWithoutFeedback
            accessibilityRole="button"
            disabled={disabled}
            hitSlop={hitSlop}
            onLongPress={handleLongPress}
            onPress={onPress}
            onPressIn={onTouchIn}
            onPressOut={onPressOut}
        >
            <Animated.View style={[scaling !== 1 && animatedStyles, style]}>{children}</Animated.View>
        </TouchableWithoutFeedback>
    );
};
