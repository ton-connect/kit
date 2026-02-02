/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../app-text';
import type { AppTextProps } from '../app-text';

export const ScreenHeaderTitle: FC<AppTextProps> = ({ style, ...props }) => {
    return <AppText style={[styles.title, style]} textType="h3" {...props} />;
};

const styles = StyleSheet.create(({ colors }) => ({
    title: {
        color: colors.text.highlight,
        textAlign: 'center',
    },
}));
