/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactElement } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../app-text';

interface Option<T extends string> {
    value: T;
    label: string;
}

interface TabControlProps<T extends string = string> {
    options: Option<T>[];
    selectedOption: string;
    additionalPadding?: number;
    onOptionPress?: (option: T) => void;
    style?: ViewStyle;
}

export const TabControl = <T extends string>({
    options,
    selectedOption,
    onOptionPress,
    style,
}: TabControlProps<T>): ReactElement => {
    return (
        <View style={[styles.container, style]}>
            {options.map((option) => (
                <TouchableWithoutFeedback
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => onOptionPress?.(option.value)}
                >
                    <View
                        style={[styles.labelContainer, selectedOption === option.value && styles.activeLabelContainer]}
                    >
                        <AppText style={[styles.label, selectedOption === option.value && styles.activeLabel]}>
                            {option.label}
                        </AppText>
                    </View>
                </TouchableWithoutFeedback>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        height: 60,
        borderRadius: sizes.borderRadius.md,
        backgroundColor: colors.navigation.default,
        overflow: 'hidden',
    },
    labelContainer: {
        width: '50%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeLabelContainer: {
        backgroundColor: colors.navigation.active,
    },
    label: {
        color: colors.text.highlight,
        textAlign: 'center',
    },
    activeLabel: {
        color: colors.text.inverted,
    },
}));
