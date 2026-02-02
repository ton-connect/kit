/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { FC } from 'react';
import { Pressable, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface Props extends ViewProps {
    color?: string;
    goBack?: () => void;
}

export const BackButton: FC<Props> = ({ style, color, goBack, ...props }) => {
    const { theme } = useUnistyles();

    const handleBackPress = (): void => {
        if (goBack) {
            goBack();

            return;
        }

        if (router.canGoBack()) router.back();
    };

    return (
        <View style={[styles.container, style]} {...props}>
            <Pressable hitSlop={10} onPress={handleBackPress}>
                <Ionicons color={color || theme.colors.text.default} name="chevron-back-outline" size={24} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(() => ({
    container: {
        // marginLeft: -6,
    },
}));
