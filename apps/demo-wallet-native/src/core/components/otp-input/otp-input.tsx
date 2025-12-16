/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { Pressable, View } from 'react-native';
import type { TextInput, ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';

interface Props extends ViewProps {
    code: string;
    onCodeChange: (value: string) => void;
    maximumLength: number;
    onFill: () => void;
}

export const OTPInput: FC<Props> = ({ code, onCodeChange, maximumLength, onFill, style, ...props }) => {
    const boxArray = new Array(maximumLength).fill(0).map((_, index) => index);
    const inputRef = useRef<TextInput>(null);

    const [isInputBoxFocused, setIsInputBoxFocused] = useState(false);

    const handleOnPress = useCallback(() => {
        setIsInputBoxFocused(true);
        inputRef.current?.focus();
    }, []);

    const handleOnBlur = (): void => {
        setIsInputBoxFocused(false);
    };

    useEffect(() => {
        handleOnPress();
    }, [handleOnPress]);

    useEffect(() => {
        if (code.length === maximumLength) {
            onFill();
        }
    }, [code, maximumLength, onFill]);

    return (
        <View style={[styles.container, style]} {...props}>
            <Pressable onPress={handleOnPress} style={styles.boxesContainer}>
                {boxArray.map((index: number) => {
                    const digit = code[index] || '';

                    const isCurrentValue = index === code.length;
                    const isLastValue = index === maximumLength - 1;
                    const isCodeComplete = code.length === maximumLength;

                    const isValueFocused = isCurrentValue || (isLastValue && isCodeComplete);

                    const splitBoxesStyle =
                        isInputBoxFocused && isValueFocused
                            ? [styles.splitBoxes, styles.splitBoxesFocused]
                            : styles.splitBoxes;

                    return (
                        <View key={index} style={splitBoxesStyle}>
                            <AppText style={styles.splitBoxText} textType="h5">
                                {digit}
                            </AppText>
                        </View>
                    );
                })}
            </Pressable>

            <AppInput
                autoComplete="sms-otp"
                keyboardType="numeric"
                maxLength={maximumLength}
                onBlur={handleOnBlur}
                onChangeText={onCodeChange}
                ref={inputRef}
                style={styles.inputHidden}
                textContentType="oneTimeCode"
                value={code}
            />
        </View>
    );
};

const styles = StyleSheet.create(({ colors }) => ({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputHidden: {
        position: 'absolute',
        opacity: 0,
    },
    boxesContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    splitBoxes: {
        borderColor: colors.background.divider,
        borderWidth: 2,
        borderRadius: 12,
        paddingTop: 2,
        width: 45,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
    },
    splitBoxText: {
        textAlign: 'center',
        color: colors.text.highlight,
    },
    splitBoxesFocused: {
        borderColor: colors.accent.primary,
    },
}));
