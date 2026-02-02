/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC, RefObject } from 'react';
import type { TextInput, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '../active-touch-action';
import { AppInput } from '../app-input';
import type { AppInputProps } from '../app-input';
import { Row } from '../grid';

interface Props extends AppInputProps {
    containerStyle?: ViewStyle;
    ref?: RefObject<TextInput | null>;
}

export const SearchInput: FC<Props> = ({ containerStyle, style, ref, ...props }) => {
    const { theme } = useUnistyles();

    const handleClear = (): void => {
        if (props.onChangeText) props.onChangeText('');
    };

    return (
        <Row style={[styles.container, containerStyle]}>
            <Ionicons color={theme.colors.text.default} name="search" size={20} style={styles.searchIcon} />

            <AppInput
                autoComplete="off"
                autoCorrect={false}
                hitSlop={5}
                ref={ref}
                style={[styles.input, style]}
                textType="body2"
                {...props}
            />

            {!!props.value?.length && (
                <ActiveTouchAction onPress={handleClear}>
                    <Ionicons
                        color={theme.colors.text.default}
                        name="close-outline"
                        size={20}
                        style={styles.closeIcon}
                    />
                </ActiveTouchAction>
            )}
        </Row>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    container: {
        paddingHorizontal: 20,
        borderRadius: sizes.borderRadius.lg,
        overflow: 'hidden',
        alignItems: 'center',
        borderColor: colors.navigation.default,
        borderWidth: 1,
        borderStyle: 'solid',
    },
    input: {
        paddingVertical: 16,
        color: colors.text.highlight,
        flex: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    closeIcon: {
        marginLeft: 8,
    },
}));
