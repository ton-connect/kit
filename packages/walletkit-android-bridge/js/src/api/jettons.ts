/**
 * Jetton helpers that proxy WalletKit operations to the native layer.
 */
import type {
  GetJettonsArgs,
  CreateTransferJettonTransactionArgs,
  GetJettonBalanceArgs,
  GetJettonWalletAddressArgs,
  CallContext,
} from '../types';
import { ensureWalletKitLoaded } from '../core/moduleLoader';
import { walletKit } from '../core/state';
import { requireWalletKit } from '../core/initialization';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { callOnWallet } from '../utils/helpers';

/**
 * Fetches jetton balances for a wallet with optional pagination.
 *
 * @param args - Wallet address and paging parameters.
 * @param context - Diagnostic context for tracing.
 */
export async function getJettons(args: GetJettonsArgs, context?: CallContext) {
  emitCallCheckpoint(context, 'getJettons:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'getJettons:after-ensureWalletKitLoaded');

  const limit = Number.isFinite(args.limit) && (args.limit as number) > 0 ? Math.floor(args.limit as number) : 100;
  const offset = Number.isFinite(args.offset) && (args.offset as number) >= 0 ? Math.floor(args.offset as number) : 0;

  console.log(
    '[walletkitBridge] getJettons fetching jettons for address:',
    args.address,
    'limit:',
    limit,
    'offset:',
    offset,
  );
  emitCallCheckpoint(context, 'getJettons:before-wallet.getJettons');

  const result = await callOnWallet({ walletKit, requireWalletKit }, args.address, 'getJettons', { limit, offset });

  emitCallCheckpoint(context, 'getJettons:after-wallet.getJettons');
  console.log('[walletkitBridge] getJettons result:', result);

  return result;
}

/**
 * Builds a jetton transfer transaction.
 *
 * @param args - Jetton transfer parameters.
 * @param context - Diagnostic context for tracing.
 */
export async function createTransferJettonTransaction(
  args: CreateTransferJettonTransactionArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'createTransferJettonTransaction:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'createTransferJettonTransaction:after-ensureWalletKitLoaded');

  console.log(
    '[walletkitBridge] createTransferJettonTransaction for jetton:',
    args.jettonAddress,
    'to:',
    args.toAddress,
    'amount:',
    args.amount,
  );
  emitCallCheckpoint(context, 'createTransferJettonTransaction:before-wallet.createTransferJettonTransaction');

  const params = {
    jettonAddress: args.jettonAddress,
    amount: args.amount,
    toAddress: args.toAddress,
    comment: args.comment,
  };

  const result = await callOnWallet(
    { walletKit, requireWalletKit },
    args.address,
    'createTransferJettonTransaction',
    params,
  );

  emitCallCheckpoint(context, 'createTransferJettonTransaction:after-wallet.createTransferJettonTransaction');
  console.log('[walletkitBridge] createTransferJettonTransaction result:', result);

  return result;
}

/**
 * Retrieves a jetton balance for the specified wallet.
 *
 * @param args - Wallet and jetton addresses.
 * @param context - Diagnostic context for tracing.
 */
export async function getJettonBalance(args: GetJettonBalanceArgs, context?: CallContext) {
  emitCallCheckpoint(context, 'getJettonBalance:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'getJettonBalance:after-ensureWalletKitLoaded');

  const jettonAddress = args.jettonAddress?.trim();
  if (!jettonAddress) {
    throw new Error('Jetton address is required');
  }

  console.log('[walletkitBridge] getJettonBalance for jetton:', jettonAddress);
  emitCallCheckpoint(context, 'getJettonBalance:before-wallet.getJettonBalance');

  const result = await callOnWallet(
    { walletKit, requireWalletKit },
    args.address,
    'getJettonBalance',
    jettonAddress,
  );

  emitCallCheckpoint(context, 'getJettonBalance:after-wallet.getJettonBalance');
  console.log('[walletkitBridge] getJettonBalance result:', result);

  return result;
}

/**
 * Resolves the jetton wallet address for a specific jetton contract.
 *
 * @param args - Wallet and jetton addresses.
 * @param context - Diagnostic context for tracing.
 */
export async function getJettonWalletAddress(
  args: GetJettonWalletAddressArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'getJettonWalletAddress:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'getJettonWalletAddress:after-ensureWalletKitLoaded');

  const jettonAddress = args.jettonAddress?.trim();
  if (!jettonAddress) {
    throw new Error('Jetton address is required');
  }

  console.log('[walletkitBridge] getJettonWalletAddress for jetton:', jettonAddress);
  emitCallCheckpoint(context, 'getJettonWalletAddress:before-wallet.getJettonWalletAddress');

  const result = await callOnWallet(
    { walletKit, requireWalletKit },
    args.address,
    'getJettonWalletAddress',
    jettonAddress,
  );

  emitCallCheckpoint(context, 'getJettonWalletAddress:after-wallet.getJettonWalletAddress');
  console.log('[walletkitBridge] getJettonWalletAddress result:', result);

  return result;
}
