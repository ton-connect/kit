/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { ScrollView, View } from 'react-native';
import type { ScrollViewProps, ViewProps, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export const Container: FC<ViewProps & { offset?: number }> = ({ style, offset, ...rest }) => {
    const { theme } = useUnistyles();
    const { sizes } = theme;

    const additional: ViewStyle = {};

    if (offset !== undefined) {
        additional.paddingHorizontal = sizes.block.paddingHorizontal + offset;
    }

    return <View {...rest} style={[styles.container, style, additional]} />;
};

export const Divider: FC<ViewProps> = ({ style, ...rest }) => {
    return <View style={[styles.divider, style]} {...rest} />;
};

export const Column: FC<ViewProps> = ({ style, ...rest }) => {
    return <View {...rest} style={[style, styles.column]} />;
};

export const Row: FC<ViewProps> = ({ style, ...rest }) => {
    return <View {...rest} style={[style, styles.row]} />;
};

export const RowCenter: FC<ViewProps> = ({ style, ...rest }) => {
    return <View {...rest} style={[style, styles.rowCenter]} />;
};

export const RowScroll: FC<ScrollViewProps> = ({ children, ...rest }) => {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} {...rest}>
            {children}
        </ScrollView>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    row: {
        flexDirection: 'row',
    },
    container: {
        paddingHorizontal: sizes.block.paddingHorizontal,
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    columnColumn: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    column: {
        flexDirection: 'column',
    },
    divider: {
        backgroundColor: colors.text.secondary,
        width: '100%',
        height: 1,
        opacity: 0.2,
    },
}));
