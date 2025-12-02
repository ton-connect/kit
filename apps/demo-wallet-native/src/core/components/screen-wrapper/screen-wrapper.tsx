/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, PropsWithChildren } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const ScreenWrapper: FC<PropsWithChildren<ScrollViewProps>> = ({ style, children, ...props }) => {
    return (
        <ScrollView showsVerticalScrollIndicator={false} style={[styles.container, style]} {...props}>
            {children}
        </ScrollView>
    );
};

const styles = StyleSheet.create(({ sizes }, runtime) => ({
    container: {
        marginTop: runtime.insets.top,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        paddingTop: sizes.page.paddingTop,
        paddingHorizontal: sizes.page.paddingHorizontal,
    },
}));
