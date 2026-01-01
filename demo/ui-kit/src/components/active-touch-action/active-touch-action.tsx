/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Pressable } from 'react-native';
import { styled } from '@tamagui/core';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

export interface ActiveTouchActionProps extends Omit<PressableProps, 'style'> {
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    scaling?: number;
}

const Container = styled(Pressable, {
    name: 'ActiveTouchAction',
    userSelect: 'none',
    backgroundColor: '$color2',
    padding: 10,
    borderRadius: 10,
    animation: 'bouncy',
});

export const ActiveTouchAction: FC<ActiveTouchActionProps> = ({
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    style,
    disabled,
    scaling = 0.96,
    children,
    hitSlop,
    ...rest
}) => {
    const shouldAnimate = scaling !== 1 && !disabled;

    return (
        <Container
            accessibilityRole="button"
            disabled={disabled}
            hitSlop={hitSlop}
            onLongPress={onLongPress}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            pressStyle={{ scale: shouldAnimate ? scaling : 1 }}
            style={style}
            {...rest}
        >
            {children}
        </Container>
    );
};
