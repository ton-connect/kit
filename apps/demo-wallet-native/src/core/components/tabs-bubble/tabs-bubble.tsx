/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { ScrollViewProps, ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ActiveTouchAction } from '../active-touch-action';
import { AppText } from '../app-text';
import type { AppTextProps } from '../app-text';
import { RowScroll } from '../grid';

export interface BubbleTabItemProps extends ViewProps {
    isActive?: boolean;
    onPress?: () => void;
    isDisabled?: boolean;
    isLast?: boolean;
}

export const BubbleTabsWrapper: FC<ScrollViewProps> = ({ children, style, ...props }) => {
    return (
        <RowScroll style={[styles.wrapperScroll, style]} {...props}>
            {children}
        </RowScroll>
    );
};

export const BubbleTabItem: FC<BubbleTabItemProps> = ({ isActive, isDisabled, onPress, children, style, isLast }) => {
    styles.useVariants({ isLast });

    if (isDisabled) {
        return (
            <ActiveTouchAction onPress={onPress} style={[styles.tab, styles.disabled, style]}>
                {children}
            </ActiveTouchAction>
        );
    }

    if (isActive) {
        return (
            <ActiveTouchAction onPress={onPress} style={[styles.tab, styles.activeTab, style]}>
                {children}
            </ActiveTouchAction>
        );
    }

    return (
        <ActiveTouchAction onPress={onPress} style={[styles.tab, style]}>
            {children}
        </ActiveTouchAction>
    );
};

export interface BubbleTabTextProps extends AppTextProps {
    isActive?: boolean;
    onPress?: () => void;
    isDisabled?: boolean;
    isLast?: boolean;
}

export const BubbleTabText: FC<BubbleTabTextProps> = ({ isActive, isDisabled, children, style }) => {
    if (isDisabled) {
        return (
            <AppText style={style} textType="caption2">
                {children}
            </AppText>
        );
    }

    if (isActive) {
        return (
            <AppText style={[styles.activeTabText, style]} textType="caption2">
                {children}
            </AppText>
        );
    }

    return (
        <AppText style={[styles.tabText, style]} textType="caption2">
            {children}
        </AppText>
    );
};

const styles = StyleSheet.create(({ colors }, runtime) => ({
    tab: {
        marginRight: 8,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.navigation.default,

        variants: {
            isLast: {
                true: {
                    marginRight: runtime.insets.right + 20,
                },
            },
        },
    },
    tabText: {
        color: colors.text.highlight,
    },
    activeTab: {
        backgroundColor: colors.navigation.active,
    },
    activeTabText: {
        color: colors.text.inverted,
    },
    wrapperScroll: {
        gap: 6,
    },
    disabled: {
        opacity: 0.5,
    },
}));
