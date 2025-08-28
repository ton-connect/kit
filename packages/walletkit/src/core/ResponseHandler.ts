// Response handling and bridge communication coordination

import type { BridgeManager } from './BridgeManager';
import type { SessionManager } from './SessionManager';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('ResponseHandler');

/**
 * Response format types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SuccessResponse<T = any> {
    result: T;
}

interface ErrorResponse {
    error: string;
    reason?: string;
    code?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Response<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Handles response formatting and sending for different request types
 */
export class ResponseHandler {
    constructor(
        private bridgeManager: BridgeManager,
        private sessionManager: SessionManager,
    ) {
        //
    }

    /**
     * Send success response
     */
    async sendSuccess<T>(requestId: string, sessionId: string | undefined, result: T): Promise<void> {
        const response: SuccessResponse<T> = { result };
        await this.sendResponse(requestId, sessionId, response);
    }

    /**
     * Send error response
     */
    async sendError(
        requestId: string,
        sessionId: string | undefined,
        error: string,
        reason?: string,
        code?: number,
    ): Promise<void> {
        const response: ErrorResponse = {
            error,
            reason,
            ...(code && { code }),
        };
        await this.sendResponse(requestId, sessionId, response);
    }

    /**
     * Send user rejection response
     */
    async sendUserRejection(requestId: string, sessionId: string | undefined, reason?: string): Promise<void> {
        await this.sendError(requestId, sessionId, 'USER_REJECTED', reason || 'User rejected the request');
    }

    /**
     * Send validation error response
     */
    async sendValidationError(
        requestId: string,
        sessionId: string | undefined,
        validationErrors: string[],
    ): Promise<void> {
        await this.sendError(requestId, sessionId, 'VALIDATION_ERROR', validationErrors.join('; '), 400);
    }

    /**
     * Send internal error response
     */
    async sendInternalError(requestId: string, sessionId: string | undefined, error?: Error): Promise<void> {
        const reason = error?.message || 'Internal server error';

        await this.sendError(requestId, sessionId, 'INTERNAL_ERROR', reason, 500);
    }

    /**
     * Send method not supported error
     */
    async sendMethodNotSupported(requestId: string, sessionId: string | undefined, method: string): Promise<void> {
        await this.sendError(requestId, sessionId, 'METHOD_NOT_SUPPORTED', `Method '${method}' is not supported`, 501);
    }

    /**
     * Send session not found error
     */
    async sendSessionNotFound(requestId: string, sessionId: string | undefined): Promise<void> {
        await this.sendError(requestId, sessionId, 'SESSION_NOT_FOUND', 'Session not found or expired', 404);
    }

    /**
     * Generic response sender with error handling
     */
    private async sendResponse<T>(
        requestId: string,
        sessionId: string | undefined,
        response: Response<T>,
    ): Promise<void> {
        try {
            // Update session activity if we have a session
            if (sessionId) {
                await this.sessionManager.updateSessionActivity(sessionId);
            }

            // Send response through bridge
            await this.bridgeManager.sendResponse(requestId, false, requestId, response);

            // Log successful response
            this.logResponse(requestId, sessionId, response, true);
        } catch (error) {
            log.error('Failed to send response', {
                requestId,
                sessionId,
                response,
                error,
            });

            // Try to send an error response about the failed response
            try {
                await this.bridgeManager.sendResponse(requestId, false, requestId, {
                    error: 'RESPONSE_FAILED',
                    reason: 'Failed to send original response',
                });
            } catch (fallbackError) {
                log.error('Failed to send fallback error response', { error: fallbackError });
            }

            throw error;
        }
    }

    /**
     * Log response for debugging/monitoring
     */
    private logResponse<T>(
        requestId: string,
        sessionId: string | undefined,
        response: Response<T>,
        success: boolean,
    ): void {
        const logData = {
            requestId,
            sessionId,
            responseType: 'error' in response ? 'error' : 'success',
            success,
            timestamp: new Date().toISOString(),
        };

        if (success) {
            log.debug('Response sent successfully', logData);
        } else {
            log.error('Failed to send response', logData);
        }
    }

    /**
     * Get response statistics (for monitoring)
     */
    getStats(): { sent: number; errors: number } {
        // TODO: Implement response statistics tracking
        return { sent: 0, errors: 0 };
    }
}
