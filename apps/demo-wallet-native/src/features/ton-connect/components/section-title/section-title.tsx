/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';

interface SectionTitleProps {
    children: ReactNode;
}

export const SectionTitle: FC<SectionTitleProps> = ({ children }) => {
    return (
        <AppText style={styles.title} textType="h5">
            {children}
        </AppText>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    title: {
        color: colors.text.highlight,
        marginVertical: sizes.space.vertical / 2,
    },
}));
