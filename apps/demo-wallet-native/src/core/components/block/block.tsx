/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const Block: FC<ViewProps> = ({ style, ...props }) => {
    return <View style={[styles.block, style]} {...props} />;
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    block: {
        backgroundColor: colors.background.block,
        borderRadius: sizes.borderRadius.md,
        paddingVertical: sizes.block.paddingVertical,
        paddingHorizontal: sizes.block.paddingHorizontal,
    },
}));
