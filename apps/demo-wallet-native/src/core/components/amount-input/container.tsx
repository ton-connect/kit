/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Block } from '../block';

export const InputContainer: FC<PropsWithChildren<ViewProps>> = ({ style, children, ...props }) => {
    return (
        <Block style={[styles.container, style]} {...props}>
            {children}
        </Block>
    );
};

const styles = StyleSheet.create(() => ({
    container: {},
}));
