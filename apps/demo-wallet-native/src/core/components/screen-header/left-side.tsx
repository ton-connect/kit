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

import { Column } from '../grid';

export const ScreenHeaderLeftSide: FC<ViewProps> = ({ style, ...props }) => {
    return <Column style={[styles.container, style]} {...props} />;
};

const styles = StyleSheet.create(() => ({
    container: {
        justifyContent: 'center',
        position: 'absolute',
        left: 0,
        height: 40,
    },
}));
