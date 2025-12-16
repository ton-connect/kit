/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { SkeletonText } from '@/core/components/skeleton';

interface Props {
    mnemonic: string | string[];
    isLoading?: boolean;
}

export const MnemonicView: FC<Props> = ({ mnemonic, isLoading }) => {
    const words = useMemo(() => {
        if (Array.isArray(mnemonic)) {
            return mnemonic;
        }

        return mnemonic.split(' ');
    }, [mnemonic]);

    return (
        <Block style={styles.container}>
            {isLoading &&
                Array.from({ length: 24 })
                    .map((_, i) => i)
                    .map((index) => (
                        <View key={index} style={styles.wordContainer}>
                            <AppText style={styles.wordNumber} textType="caption1">
                                {index + 1}.
                            </AppText>
                            <SkeletonText />
                        </View>
                    ))}

            {!isLoading &&
                words.map((word, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: no order change
                    <View key={index} style={styles.wordContainer}>
                        <AppText style={styles.wordNumber} textType="caption1">
                            {index + 1}.
                        </AppText>
                        <AppText style={styles.word} textType="body1">
                            {word}
                        </AppText>
                    </View>
                ))}
        </Block>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: sizes.space.vertical,
        padding: sizes.space.vertical,
    },
    wordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '45%',
        paddingVertical: sizes.space.vertical / 2,
        paddingHorizontal: sizes.space.horizontal / 2,
        gap: sizes.space.horizontal / 2,
    },
    wordNumber: {
        marginTop: 2,
        color: colors.text.secondary,
        width: 24,
    },
    word: {
        color: colors.text.highlight,
    },
}));
