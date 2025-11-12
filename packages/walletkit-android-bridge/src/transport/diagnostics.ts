/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Diagnostic helpers that forward bridge call checkpoints to the native layer.
 */
import type { WalletKitApiMethod, DiagnosticStage } from '../types';
import { postToNative } from './nativeBridge';

/**
 * Emits detailed call diagnostics to the native layer for tracing bridge activity.
 */
export function emitCallDiagnostic(
    id: string,
    method: WalletKitApiMethod,
    stage: DiagnosticStage,
    message?: string,
): void {
    postToNative({
        kind: 'diagnostic-call',
        id,
        method,
        stage,
        timestamp: Date.now(),
        message,
    });
}
