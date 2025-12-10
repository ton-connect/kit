/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { setStringAsync } from 'expo-clipboard';
import { type FC, useMemo, useState } from 'react';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import QRCode from 'react-native-qrcode-skia';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton } from '@/core/components/app-button';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { Row } from '@/core/components/grid';
import { useAppToasts } from '@/features/toasts';

interface Props extends ViewProps {
    address: string;
}

export const AddressQrcode: FC<Props> = ({ address, style, ...props }) => {
    const [blockWidth, setBlockWidth] = useState(0);

    const { theme } = useUnistyles();
    const { toast } = useAppToasts();

    const qrCodeSize = useMemo(() => {
        if (!blockWidth) return 0;

        const width = blockWidth - theme.sizes.block.paddingHorizontal * 2;

        return width > 270 ? 270 : width;
    }, [blockWidth, theme.sizes]);

    const handleCopy = async (): Promise<void> => {
        try {
            await setStringAsync(address);
            toast({ type: 'success', title: 'Copied' });
        } catch (_e) {
            toast({ type: 'error', title: 'Something went wrong' });
        }
    };

    const onLayout = (event: LayoutChangeEvent): void => {
        const { width } = event.nativeEvent.layout;
        setBlockWidth(width);
    };

    return (
        <Block onLayout={onLayout} style={[styles.container, style]} {...props}>
            <Row style={styles.inputContainer}>
                <AppText ellipsizeMode="middle" numberOfLines={1} style={styles.input} textType="body2">
                    {address}
                </AppText>

                <AppButton.Container onPress={handleCopy} variant="input">
                    <AppButton.Text>Copy</AppButton.Text>
                </AppButton.Container>
            </Row>

            <QRCode
                shapeOptions={{
                    shape: 'rounded',
                    eyePatternShape: 'square',
                    eyePatternGap: 0,
                    gap: 0,
                }}
                size={qrCodeSize}
                value={address}
            />
        </Block>
    );
};

const styles = StyleSheet.create(({ colors, sizes, fonts }) => ({
    container: {
        paddingBottom: 50,
    },
    header: {
        marginBottom: 15,
    },
    inputContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: sizes.space.vertical * 3,
        backgroundColor: colors.background.main,
        borderRadius: sizes.borderRadius.sm,
        borderColor: colors.navigation.default,
        borderWidth: 1,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        marginRight: 12,
        color: colors.text.highlight,
        height: fonts.size.md,
    },
    text: {
        maxWidth: 260,
        textAlign: 'center',
        alignSelf: 'center',
        marginBottom: 30,
        color: colors.text.secondary,
    },
}));
