/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC, RefObject } from 'react';
import type { TextInput, TextInputProps, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppInput } from '../app-input';
import { TextAmount } from '../text-amount';

import { Column } from '@/core/components/grid';
import { Big } from '@/core/libs/big-number';
import { parseNumberFromString } from '@/core/utils/amount/parse-numeric-string';

export interface Props extends Omit<TextInputProps, 'style'> {
    amount: string;
    onChangeAmount: (amount: string) => void;
    style?: ViewStyle;
    fiatRate?: string;
    balance?: string;
    ref?: RefObject<TextInput | null>;
}

export const InputWithFiat: FC<Props> = ({ amount, onChangeAmount, fiatRate, style, ref, ...props }) => {
    const textLength = useMemo(() => {
        if (amount.length > 12) return 'veryLong';

        if (amount.length > 6) return 'long';
    }, [amount]);

    styles.useVariants({ textLength });

    const fiatAmount = useMemo(() => {
        const parsed = parseNumberFromString(amount);

        return Big(parsed || 0)
            .times(fiatRate || 0)
            .toString();
    }, [amount, fiatRate]);

    const handleBlur = (): void => {
        const parsed = parseNumberFromString(amount);

        if (amount !== parsed) {
            onChangeAmount(Big(parsed).abs().toString());
        }
    };

    const handleChange = (value: string): void => {
        if (value.includes(',')) {
            onChangeAmount(value.replace(',', '.'));
        } else {
            onChangeAmount(value);
        }
    };

    return (
        <Column style={[styles.container, style]}>
            <Column style={styles.inputContainer}>
                <AppInput
                    allowFontScaling
                    caretHidden
                    keyboardType="decimal-pad"
                    maxFontSizeMultiplier={null}
                    multiline={false}
                    numberOfLines={1}
                    onBlur={handleBlur}
                    onChangeText={handleChange}
                    placeholder="0.0"
                    ref={ref}
                    style={styles.input}
                    value={amount}
                    {...props}
                />
            </Column>

            {fiatRate && (
                <TextAmount
                    amount={fiatAmount}
                    decimals={fiatAmount === '0' ? 1 : undefined}
                    isDecimalsFixed={fiatAmount === '0' ? true : undefined}
                    isFiat
                    isSymbolShown
                    style={styles.fiatAmount}
                />
            )}
        </Column>
    );
};

InputWithFiat.displayName = 'InputWithFiat';

const styles = StyleSheet.create(({ fonts, colors }) => ({
    container: {
        alignItems: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',

        variants: {
            textLength: {
                veryLong: {
                    height: fonts.lineHeight.xxl - 15,
                },
                long: {
                    height: fonts.lineHeight.xxl,
                },
                default: {
                    height: fonts.lineHeight.xxl,
                },
            },
        },
    },
    input: {
        flex: 1,
        minWidth: 200,
        textAlign: 'center',
        overflow: 'hidden',
        fontFamily: fonts.family.semiBold,
        color: colors.text.highlight,

        variants: {
            textLength: {
                veryLong: {
                    fontSize: fonts.size.lg,
                    lineHeight: fonts.lineHeight.lg,
                },
                long: {
                    fontSize: fonts.size.xl,
                    lineHeight: fonts.lineHeight.xl,
                },
                default: {
                    fontSize: fonts.size.xxl,
                    lineHeight: fonts.lineHeight.xxl,
                },
            },
        },
    },
    fiatAmount: {
        marginTop: 4,
    },
}));
