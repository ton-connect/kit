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

export const ScreenHeaderContainer: FC<ViewProps> = ({ style, ...props }) => {
    return <Row style={[styles.container, style]} {...props} />;
};

const styles = StyleSheet.create(({ sizes }) => ({
    container: {
        width: '100%',
        position: 'relative',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: sizes.space.vertical,
    },
}));
