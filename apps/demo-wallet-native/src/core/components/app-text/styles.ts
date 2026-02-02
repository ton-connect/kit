/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StyleSheet } from 'react-native-unistyles';

export const textStylesheet = StyleSheet.create(({ fonts, colors }) => ({
    base: {
        color: colors.text.default,
    },
    h1: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.xxl,
        lineHeight: fonts.lineHeight.xxl,
    },
    h2: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.xl,
        lineHeight: fonts.lineHeight.xl,
    },
    h3: {
        fontFamily: fonts.family.bold,
        fontSize: fonts.size.lg,
        lineHeight: fonts.lineHeight.lg,
    },
    h4: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.lg,
        lineHeight: fonts.lineHeight.lg,
    },
    h5: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.md,
        lineHeight: fonts.lineHeight.md,
    },
    body1: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.sm,
        lineHeight: fonts.lineHeight.sm,
    },
    body2: {
        fontFamily: fonts.family.medium,
        fontSize: fonts.size.sm,
        lineHeight: fonts.lineHeight.sm,
    },
    caption1: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.xs,
        lineHeight: fonts.lineHeight.xs,
    },
    caption2: {
        fontFamily: fonts.family.medium,
        fontSize: fonts.size.xs,
        lineHeight: fonts.lineHeight.xs,
    },
    caption3: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.xxs,
        lineHeight: fonts.lineHeight.xxs,
    },
    micro: {
        fontFamily: fonts.family.semiBold,
        fontSize: fonts.size.xxs,
        lineHeight: fonts.lineHeight.xxs,
    },
}));
