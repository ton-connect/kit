/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC, RefObject } from 'react';
import { View } from 'react-native';
import type { TextInput, ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppInput } from '../app-input';
import type { AppInputProps } from '../app-input';
import { Row } from '../grid';

import type { PropsOf } from '@/core/utils/component-props';

const Container: FC<ViewProps & { isError?: boolean }> = ({ style, isError, ...props }) => {
    return <Row style={[styles.inputContainer, isError && styles.errorInputContainer, style]} {...props} />;
};

const LeftIcon: FC<PropsOf<typeof Ionicons>> = ({ name, color, style }) => {
    const { theme } = useUnistyles();

    return (
        <Ionicons color={color || theme.colors.text.default} name={name} size={20} style={[styles.leftIcon, style]} />
    );
};

const RightSide: FC<ViewProps> = ({ style, ...props }) => {
    return <View style={[styles.rightSide, style]} {...props} />;
};

const TextField: FC<AppInputProps & { ref?: RefObject<TextInput | null> }> = ({ style, ref, ...props }) => {
    return <AppInput hitSlop={5} ref={ref} style={[styles.input, style]} textType="body2" {...props} />;
};

TextField.displayName = 'TextField';

export const Input = {
    Container,
    LeftIcon,
    RightSide,
    TextField,
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    inputContainer: {
        paddingHorizontal: 15,
        borderRadius: sizes.borderRadius.sm,
        overflow: 'hidden',
        alignItems: 'center',
        borderColor: colors.navigation.default,
        borderWidth: 1,
        borderStyle: 'solid',
        backgroundColor: colors.background.main,
        marginBottom: sizes.space.vertical,
    },
    input: {
        paddingVertical: 16,
        color: colors.text.highlight,
        flex: 1,
    },
    leftIcon: {
        marginRight: 10,
    },
    rightSide: {
        marginLeft: 10,
    },
    errorInputContainer: {
        borderColor: colors.error.default,
    },
}));
