/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Image } from 'expo-image';
import type { ImageProps } from 'expo-image';
import type { FC } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface WithSize {
    size?: number;
}

export const Container: FC<ViewProps & WithSize> = ({ style, size = 35, ...props }) => {
    return <View style={[styles.container, { width: size }, style]} {...props} />;
};

export const Logo: FC<ImageProps & WithSize> = ({ size = 35, style, ...props }) => {
    return <Image contentFit="cover" style={[styles.logo, { width: size, height: size }, style]} {...props} />;
};

export const Badge: FC<ImageProps & WithSize> = ({ size = 16, style, ...props }) => {
    return <Logo size={size} style={[styles.badge, { marginTop: size / -2 }, style]} {...props} />;
};

const styles = StyleSheet.create(({ sizes }) => ({
    container: {},
    logo: {
        borderRadius: sizes.borderRadius.rounded,
    },
    badge: {
        marginLeft: 'auto',
    },
}));
