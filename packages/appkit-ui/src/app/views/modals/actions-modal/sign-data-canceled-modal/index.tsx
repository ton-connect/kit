/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component } from 'solid-js';
import { ActionModal } from 'src/app/views/modals/actions-modal/action-modal';
import { ErrorIcon } from 'src/app/components';

interface SignDataCanceledModalProps {
    onClose: () => void;
}

export const SignDataCanceledModal: Component<SignDataCanceledModalProps> = (props) => {
    return (
        <ActionModal
            headerTranslationKey="actionModal.signDataCanceled.header"
            icon={<ErrorIcon size="m" />}
            onClose={() => props.onClose()}
            data-tc-sign-data-canceled-modal="true"
        />
    );
};
