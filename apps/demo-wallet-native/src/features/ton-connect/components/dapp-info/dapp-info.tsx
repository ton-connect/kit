/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Image, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

interface DAppInfoProps {
    name?: string;
    description?: string;
    url?: string;
    iconUrl?: string;
}

export const DAppInfo: FC<DAppInfoProps> = ({ name, description, url, iconUrl }) => {
    const displayUrl = url ? new URL(url).hostname : undefined;

    return (
        <Block style={styles.container}>
            {iconUrl && <Image source={{ uri: iconUrl }} style={styles.icon} resizeMode="contain" />}

            <View style={styles.info}>
                {name && (
                    <AppText style={styles.name} textType="h5">
                        {name}
                    </AppText>
                )}
                {displayUrl && (
                    <AppText style={styles.url} textType="caption1">
                        {displayUrl}
                    </AppText>
                )}
                {description && (
                    <AppText style={styles.description} textType="body1">
                        {description}
                    </AppText>
                )}
            </View>
        </Block>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizes.space.horizontal / 2,
        backgroundColor: colors.background.secondary,
        gap: sizes.space.horizontal / 2,
    },
    icon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.background.main,
    },
    info: {
        flex: 1,
    },
    name: {
        color: colors.text.highlight,
    },
    url: {
        color: colors.text.secondary,
    },
    description: {
        color: colors.text.default,
    },
}));
