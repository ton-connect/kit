/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from 'solid-styled-components';

export const H3Styled = styled.h3`
    font-style: normal;
    font-weight: 510;
    font-size: 16px;
    line-height: 20px;

    color: ${(props) => props.theme!.colors.text.primary};

    margin-top: 0;
    margin-bottom: 0;

    cursor: default;
`;
