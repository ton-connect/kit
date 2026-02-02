/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import type { TextStyle, ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../app-text';
import { Row } from '../grid';

interface Props extends ViewProps {
    textStyle?: TextStyle;
}

export const ErrorMessage: FC<Props> = ({ style, textStyle, children, ...props }) => {
    const { theme } = useUnistyles();

    return (
        <Row style={[styles.block, style]} {...props}>
            <Ionicons color={theme.colors.error.default} name="alert-circle-outline" size={24} />
            <AppText style={[styles.text, textStyle]}>{children}</AppText>
        </Row>
    );
};

const styles = StyleSheet.create(({ colors }) => ({
    block: {
        gap: 6,
        alignItems: 'center',
    },
    text: {
        color: colors.error.default,
    },
}));
