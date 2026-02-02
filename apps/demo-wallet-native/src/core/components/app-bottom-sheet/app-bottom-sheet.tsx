/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetModalProps as InitialBottomSheetProps } from '@gorhom/bottom-sheet';
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';

export interface BottomSheetProps {
    isOpened: boolean;
    isScrollable?: boolean;
    onClose: () => void;
    isDisabledClose?: boolean;
    withCloseButton?: boolean;
    title?: string;
}

type Props = BottomSheetProps & PropsWithChildren & InitialBottomSheetProps;

export const AppBottomSheet: FC<Props> = ({
    isScrollable,
    isOpened,
    isDisabledClose,
    onClose,
    children,
    withCloseButton,
    title,
    keyboardBehavior = 'interactive',
    keyboardBlurBehavior = 'restore',
    android_keyboardInputMode = 'adjustResize',
    ...rest
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const backgroundAnim = useSharedValue(isOpened ? 1 : 0);
    const opacity = useSharedValue(isOpened ? 1 : 0);
    const { theme } = useUnistyles();
    const { top } = useSafeAreaInsets();

    const handleClose = useCallback(() => {
        bottomSheetRef.current?.close();
        onClose();
    }, [onClose]);

    const renderBackdrop = useCallback(
        () => (
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]}>
                <Pressable onPress={isDisabledClose ? undefined : handleClose} style={styles.background} />
            </Animated.View>
        ),
        [handleClose, isDisabledClose, opacity],
    );

    useEffect(() => {
        if (!isOpened) {
            opacity.value = withDelay(100, withTiming(0, { duration: 200 }));
            handleClose();

            return;
        }

        opacity.value = withDelay(100, withTiming(1, { duration: 300 }));
        void impactAsync(ImpactFeedbackStyle.Light);
    }, [isOpened, handleClose, opacity]);

    useEffect(() => {
        if (!isOpened) {
            bottomSheetRef.current?.snapToIndex(-1);
            bottomSheetRef.current?.dismiss();

            return;
        }

        bottomSheetRef.current?.present();
        bottomSheetRef.current?.snapToIndex(0);
    }, [isOpened]);

    return (
        <BottomSheetModal
            animatedPosition={backgroundAnim}
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.wrapper}
            enablePanDownToClose={!isDisabledClose}
            handleIndicatorStyle={styles.indicator}
            onDismiss={handleClose}
            ref={bottomSheetRef}
            stackBehavior="push"
            topInset={top}
            keyboardBehavior={keyboardBehavior}
            keyboardBlurBehavior={keyboardBlurBehavior}
            android_keyboardInputMode={android_keyboardInputMode}
            {...rest}
        >
            {isScrollable === false && (
                <BottomSheetView style={styles.scrollWrapper}>
                    {title && (
                        <AppText style={styles.title} textType="h3">
                            {title}
                        </AppText>
                    )}

                    {children}

                    {withCloseButton && (
                        <ActiveTouchAction onPress={onClose} style={styles.closeButton}>
                            <Ionicons color={theme.colors.text.default} name="close-outline" size={24} />
                        </ActiveTouchAction>
                    )}
                </BottomSheetView>
            )}

            {isScrollable !== false && (
                <BottomSheetScrollView style={styles.scrollWrapper}>
                    {title && (
                        <AppText style={styles.title} textType="h3">
                            {title}
                        </AppText>
                    )}

                    {children}

                    {withCloseButton && (
                        <ActiveTouchAction onPress={onClose} style={styles.closeButton}>
                            <Ionicons color={theme.colors.text.default} name="close-outline" size={22} />
                        </ActiveTouchAction>
                    )}

                    <View style={styles.space} />
                </BottomSheetScrollView>
            )}
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create(({ colors, sizes }, runtime) => ({
    wrapper: {
        backgroundColor: colors.background.modal,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    scrollWrapper: {
        paddingHorizontal: sizes.page.paddingHorizontal,
        paddingTop: sizes.space.vertical,
        position: 'relative',
    },
    indicator: {
        display: 'none',
        backgroundColor: colors.text.default,
    },
    space: {
        height: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    title: {
        color: colors.text.highlight,
        textAlign: 'center',
        marginBottom: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 12,
    },
}));
