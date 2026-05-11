/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { TokenSelectModal } from '../../../../components/shared/token-select-modal';
import type { TokenSelectModalProps } from '../../../../components/shared/token-select-modal';
import { useI18n } from '../../../settings/hooks/use-i18n';

/**
 * Props accepted by `SwapTokenSelectModal` — same shape as the underlying {@link TokenSelectModalProps} but with the title and search placeholder fixed to the swap-flow strings.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type SwapTokenSelectModalProps = Omit<TokenSelectModalProps, 'title' | 'searchPlaceholder'>;

/**
 * Token picker used by the swap widget — thin wrapper around the shared `TokenSelectModal` that hard-codes the swap-specific title and search placeholder.
 *
 * @public
 * @category Component
 * @section Swap
 */
export const SwapTokenSelectModal: FC<SwapTokenSelectModalProps> = (props) => {
    const { t } = useI18n();

    return <TokenSelectModal {...props} title={t('swap.selectToken')} searchPlaceholder={t('swap.searchToken')} />;
};
