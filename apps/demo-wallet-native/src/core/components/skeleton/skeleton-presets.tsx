/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Block } from '../block';
import { Skeleton } from './skeleton';

interface SkeletonPresetProps {
    style?: ViewStyle;
    animate?: boolean;
}

export const SkeletonText: FC<SkeletonPresetProps & { lines?: number }> = ({ lines = 1, style, animate = true }) => (
    <View style={[styles.textContainer, style]}>
        {Array.from({ length: lines }, (_, index) => (
            <Skeleton
                animate={animate}
                borderRadius={4}
                height={16}
                // biome-ignore lint/suspicious/noArrayIndexKey: no changes in order
                key={index}
                style={index > 0 ? styles.textLine : undefined}
                width={index === lines - 1 ? '70%' : '100%'}
            />
        ))}
    </View>
);

export const SkeletonCircle: FC<SkeletonPresetProps & { size?: number }> = ({ size = 40, style, animate = true }) => (
    <Skeleton animate={animate} borderRadius={size / 2} height={size} style={style} width={size} />
);

export const SkeletonListItem: FC<SkeletonPresetProps> = ({ style, animate = true }) => (
    <Block style={[styles.listItem, style]}>
        <SkeletonCircle animate={animate} size={35} />

        <View style={styles.listItemLeftSide}>
            <Skeleton animate={animate} height={16} width="40%" />
            <Skeleton animate={animate} height={10} style={styles.listItemSubtitle} width="20%" />
        </View>

        <View style={styles.listItemRightSide}>
            <Skeleton animate={animate} height={16} width="40%" />
            <Skeleton animate={animate} height={10} style={styles.listItemSubtitle} width="20%" />
        </View>
    </Block>
);

const styles = StyleSheet.create(({ sizes }) => ({
    textContainer: {
        width: '100%',
    },
    textLine: {
        marginTop: sizes.space.vertical,
    },
    listItem: {
        padding: sizes.space.vertical,
        flexDirection: 'row',
        alignItems: 'center',
        height: 80,
        marginBottom: 8,
        borderRadius: 12,
    },
    listItemLeftSide: {
        marginLeft: 10,
        flex: 1,
    },
    listItemRightSide: {
        flex: 1,
        alignItems: 'flex-end',
        marginLeft: 'auto',
    },
    listItemSubtitle: {
        marginTop: 4,
    },
}));
