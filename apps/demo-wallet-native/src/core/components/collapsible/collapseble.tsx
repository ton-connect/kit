/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Props extends PropsWithChildren {
    isOpened: boolean;
}

export const Collapsible: FC<Props> = ({ isOpened, children }) => {
    const [height, setHeight] = useState(0);

    const collapsableStyle = useAnimatedStyle(() => {
        return { height: isOpened ? withTiming(height) : withTiming(0) };
    });

    const onLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const onLayoutHeight = event.nativeEvent.layout.height;

            if (onLayoutHeight > 0 && height !== onLayoutHeight) {
                setHeight(onLayoutHeight);
            }
        },
        [height],
    );

    return (
        <Animated.View style={[collapsableStyle, { overflow: 'hidden' }]}>
            <View onLayout={onLayout} style={{ position: 'absolute' }}>
                {children}
            </View>
        </Animated.View>
    );
};
