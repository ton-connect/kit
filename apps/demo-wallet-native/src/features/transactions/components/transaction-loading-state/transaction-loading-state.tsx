/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { RowCenter } from '@/core/components/grid';
import { LoaderCircle } from '@/core/components/loader-circle';

export const TransactionLoadingState: FC = () => {
    return (
        <RowCenter style={styles.container}>
            <LoaderCircle size={64} />
        </RowCenter>
    );
};

const styles = StyleSheet.create(() => ({
    container: {
        marginTop: 60,
    },
}));
