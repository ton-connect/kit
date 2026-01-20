/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { SignDataRequestEvent } from '@ton/walletkit';

interface Props {
    preview: SignDataRequestEvent['preview'];
}

export const SignDataRequestPreview: FC<Props> = ({ preview }) => {
    switch (preview.data.type) {
        case 'text':
            return (
                <div className="border rounded-lg p-3 bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">Text Message</h4>
                    <p className="text-sm text-blue-800 break-words">{preview.data.value.content}</p>
                </div>
            );

        case 'binary':
            return (
                <div className="border rounded-lg p-3 bg-green-50">
                    <h4 className="font-medium text-green-900 mb-2">Binary Data</h4>
                    <div className="space-y-2">
                        <p className="text-sm text-green-800">Content: {preview.data.value.content}</p>
                    </div>
                </div>
            );

        case 'cell':
            return (
                <div className="">
                    {/* <h4 className="font-medium mb-2">TON Cell Data</h4> */}
                    <div className="space-y-2">
                        <div>
                            <p className="font-medium">Content</p>
                            <p className="text-gray-600 text-sm overflow-x-auto whitespace-pre-wrap">
                                {preview.data.value.content}
                            </p>
                        </div>
                        {preview.data.value.schema && (
                            <div>
                                <p className="font-medium">Schema</p>
                                <p className="text-gray-600 text-sm overflow-x-auto whitespace-pre-wrap">
                                    {preview.data.value.schema}
                                </p>
                            </div>
                        )}
                        {/* <p className="text-sm overflow-x-auto whitespace-pre-wrap">Content: {preview.content}</p> */}
                        {/* {preview.schema && <p className="text-sm">Schema: {preview.schema}</p>} */}
                        {preview.data.value.parsed && (
                            <div>
                                <p className="font-medium mb-1">Parsed Data:</p>
                                <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-gray-100 p-2 rounded-lg">
                                    {JSON.stringify(preview.data.value.parsed, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            );

        default:
            return (
                <div className="border rounded-lg p-3 bg-gray-50">
                    {/* <h4 className="font-medium text-gray-900 mb-2">Data to Sign</h4> */}
                    <p className="text-sm text-gray-600">Unknown data format</p>
                </div>
            );
    }
};
