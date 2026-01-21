/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component } from 'solid-js';
import { ActionModal } from 'src/app/views/modals/actions-modal/action-modal';
import { SuccessIcon } from 'src/app/components';

interface DataSignedModalProps {
    onClose: () => void;
}

export const DataSignedModal: Component<DataSignedModalProps> = (props) => {
    return (
        <ActionModal
            headerTranslationKey="actionModal.dataSigned.header"
            icon={<SuccessIcon size="m" />}
            onClose={() => props.onClose()}
            data-tc-data-signed-modal="true"
        />
    );
};
