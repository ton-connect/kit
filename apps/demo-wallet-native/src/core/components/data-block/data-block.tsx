/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import type { AppTextProps } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { Column, Divider, Row } from '@/core/components/grid';
import { TextAmount } from '@/core/components/text-amount';
import type { TextAmountProps } from '@/core/components/text-amount';

export const DataBlockContainer: FC<ViewProps> = ({ style, ...props }) => {
    return <Block style={[styles.container, style]} {...props} />;
};

export interface DataBlockRowProps extends ViewProps {
    innerRowStyle?: ViewStyle;
    isLastRow?: boolean;
}

export const DataBlockRow: FC<DataBlockRowProps> = ({ style, innerRowStyle, isLastRow, children, ...props }) => {
    return (
        <Column style={[styles.rowContainer, style]} {...props}>
            <Row style={[styles.row, innerRowStyle]}>{children}</Row>

            {!isLastRow && <Divider style={styles.divider} />}
        </Column>
    );
};

export const DataBlockKey: FC<ViewProps> = ({ style, ...props }) => {
    return <Row style={[styles.key, style]} {...props} />;
};

export const DataBlockValue: FC<ViewProps> = ({ style, ...props }) => {
    return <Row style={[styles.value, style]} {...props} />;
};

export const DataBlockText: FC<AppTextProps> = ({ style, ...props }) => {
    return <AppText style={[styles.text, style]} textType="body2" {...props} />;
};

export const DataBlockTextAmount: FC<TextAmountProps> = ({ style, ...props }) => {
    return <TextAmount style={[styles.text, style]} textType="body2" {...props} />;
};

const styles = StyleSheet.create(({ colors }) => ({
    container: {
        paddingVertical: 12,
    },
    rowContainer: {
        width: '100%',
        paddingTop: 2,
    },
    row: {
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,

        variants: {
            isLastRow: {
                false: {
                    borderBottomColor: colors.background.divider,
                },
            },
        },
    },
    key: {
        // marginRight: 'auto',
    },
    value: {
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    text: {},
    divider: {
        marginTop: 2,
    },
}));
