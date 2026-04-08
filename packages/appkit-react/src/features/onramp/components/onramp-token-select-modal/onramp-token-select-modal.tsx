/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { TokenSelectModal } from '../../../../components/token-select-modal';
import type { TokenSelectModalProps } from '../../../../components/token-select-modal';
import { useI18n } from '../../../settings/hooks/use-i18n';

export type OnrampTokenSelectModalProps = Omit<TokenSelectModalProps, 'title' | 'searchPlaceholder'>;

export const OnrampTokenSelectModal: FC<OnrampTokenSelectModalProps> = (props) => {
    const { t } = useI18n();

    return <TokenSelectModal {...props} title={t('onramp.selectToken')} searchPlaceholder={t('onramp.searchToken')} />;
};
