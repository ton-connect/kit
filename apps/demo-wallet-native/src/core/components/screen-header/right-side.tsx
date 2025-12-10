/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Row } from '../grid';

export const ScreenHeaderRightSide: FC<ViewProps> = ({ style, ...props }) => {
    return <Row style={[styles.container, style]} {...props} />;
};

const styles = StyleSheet.create(({ sizes }) => ({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: 0,
        height: 40,
        gap: sizes.space.horizontal / 2,
    },
}));
