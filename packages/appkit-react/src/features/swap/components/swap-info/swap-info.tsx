/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';

import { InfoBlock } from '../../../../components/info-block';

export interface SwapInfoRowProps {
    label: string;
    value: string;
}

export interface SwapInfoProps extends ComponentProps<typeof InfoBlock.Container> {
    rows: SwapInfoRowProps[];
    isLoading?: boolean;
}

export const SwapInfo: FC<SwapInfoProps> = ({ rows, isLoading, ...props }) => {
    return (
        <InfoBlock.Container {...props}>
            {isLoading
                ? Array.from({ length: 3 }).map((_, idx) => (
                      <InfoBlock.Row key={idx}>
                          <InfoBlock.LabelSkeleton />
                          <InfoBlock.ValueSkeleton />
                      </InfoBlock.Row>
                  ))
                : rows.map((row, idx) => (
                      <InfoBlock.Row key={idx}>
                          <InfoBlock.Label>{row.label}</InfoBlock.Label>
                          <InfoBlock.Value>{row.value}</InfoBlock.Value>
                      </InfoBlock.Row>
                  ))}
        </InfoBlock.Container>
    );
};
