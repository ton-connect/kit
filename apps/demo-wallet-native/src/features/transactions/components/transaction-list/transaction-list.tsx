/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LegendList } from '@legendapp/list';
import type { LegendListProps } from '@legendapp/list';
import type { ReactNode } from 'react';

type BaseListProps<T> = Omit<LegendListProps<T>, 'data' | 'renderItem' | 'children'>;

interface TransactionListProps<T> extends BaseListProps<T> {
    data?: T[];
    renderItem?: (item: T, index: number) => ReactNode;
    keyExtractor?: (item: T, index: number) => string;
}

export const TransactionList = <T = object,>({
    data = [],
    renderItem,
    keyExtractor,
    ...props
}: TransactionListProps<T>) => {
    return (
        <LegendList
            data={data}
            estimatedItemSize={76}
            keyExtractor={(item, index) => keyExtractor?.(item, index) || String(index)}
            renderItem={({ item, index }) => renderItem?.(item, index)}
            showsVerticalScrollIndicator={false}
            {...props}
        />
    );
};
