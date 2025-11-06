/**
 * Transaction helpers covering previews, submission, and history enrichment.
 */
import type {
  CallContext,
  GetRecentTransactionsArgs,
  CreateTransferTonTransactionArgs,
  CreateTransferMultiTonTransactionArgs,
  TransactionContentArgs,
} from '../types';
import { ensureWalletKitLoaded, Address, Cell, CHAIN } from '../core/moduleLoader';
import { walletKit, currentNetwork } from '../core/state';
import { requireWalletKit } from '../core/initialization';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { toUserFriendlyAddress, base64ToHex } from '../utils/address';
import { extractTextComment } from '../utils/parsing';

/**
 * Fetches the recent transactions for the given wallet and augments them with user-friendly metadata.
 *
 * @param args - Wallet address and optional pagination limit.
 * @param context - Diagnostic context for tracing.
 */
export async function getRecentTransactions(
  args: GetRecentTransactionsArgs,
  context?: CallContext,
): Promise<{ items: unknown[] }> {
  emitCallCheckpoint(context, 'getRecentTransactions:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'getRecentTransactions:after-ensureWalletKitLoaded');
  requireWalletKit();
  const address = args.address?.trim();
  if (!address) {
    throw new Error('Wallet address is required');
  }
  const wallet = walletKit.getWallet?.(address);
  if (!wallet) {
    throw new Error(`Wallet not found for address ${address}`);
  }
  const limit = Number.isFinite(args.limit) && (args.limit as number) > 0 ? Math.floor(args.limit as number) : 10;

  console.log('[walletkitBridge] getRecentTransactions fetching transactions for address:', address);
  emitCallCheckpoint(context, 'getRecentTransactions:before-client.getAccountTransactions');

  const response = await wallet.client.getAccountTransactions({
    address: [address],
    limit,
  });

  const transactions = response?.transactions || [];
  console.log('[walletkitBridge] getRecentTransactions fetched:', transactions.length, 'transactions');
  console.log('[walletkitBridge] Address helper available:', !!Address, 'Cell helper available:', !!Cell);

  if (transactions.length > 0) {
    const firstTx = transactions[0];
    console.log('[walletkitBridge] First tx keys:', Object.keys(firstTx).join(', '));
    if (firstTx.in_msg) {
      console.log('[walletkitBridge] in_msg keys:', Object.keys(firstTx.in_msg).join(', '));
      if (firstTx.in_msg.message_content) {
        console.log(
          '[walletkitBridge] in_msg.message_content keys:',
          Object.keys(firstTx.in_msg.message_content).join(', '),
        );
      }
    }
  }

  const isTestnet = CHAIN ? currentNetwork === CHAIN.TESTNET : true;
  const addressOptions = {
    addressParser: Address,
    isTestnet,
  };

  const processedTransactions = transactions.map((tx: any, idx: number) => {
    if (typeof tx.hash === 'string' && !tx.hash_hex) {
      tx.hash_hex = base64ToHex(tx.hash);
    }

    if (tx.in_msg?.source) {
      const rawAddr = tx.in_msg.source;
      const friendlyAddr = toUserFriendlyAddress(rawAddr, addressOptions);
      tx.in_msg.source_friendly = friendlyAddr;
      if (idx === 0) {
        console.log('[walletkitBridge] Converting source address:', rawAddr, '→', friendlyAddr);
      }
    }
    if (tx.in_msg?.destination) {
      const rawAddr = tx.in_msg.destination;
      const friendlyAddr = toUserFriendlyAddress(rawAddr, addressOptions);
      tx.in_msg.destination_friendly = friendlyAddr;
      if (idx === 0) {
        console.log('[walletkitBridge] Converting destination address:', rawAddr, '→', friendlyAddr);
      }
    }

    if (tx.out_msgs && Array.isArray(tx.out_msgs)) {
      tx.out_msgs = tx.out_msgs.map((msg: any) => {
        const processed = { ...msg };
        if (msg.source) {
          processed.source_friendly = toUserFriendlyAddress(msg.source, addressOptions);
        }
        if (msg.destination) {
          processed.destination_friendly = toUserFriendlyAddress(msg.destination, addressOptions);
        }
        if (msg.message_content?.body) {
          const comment = extractTextComment(msg.message_content.body, Cell);
          if (comment) {
            processed.comment = comment;
          }
        }
        return processed;
      });
    }

    if (tx.in_msg?.message_content?.body) {
      const body = tx.in_msg.message_content.body;
      if (idx === 0) {
        console.log(
          '[walletkitBridge] in_msg.message_content.body exists, type:',
          typeof body,
          'value:',
          body ? body.substring(0, 100) : 'null',
        );
      }
      const comment = extractTextComment(body, Cell);
      if (comment) {
        tx.in_msg.comment = comment;
        if (idx === 0) {
          console.log('[walletkitBridge] Extracted comment from in_msg:', comment);
        }
      } else if (idx === 0) {
        console.log('[walletkitBridge] No comment extracted from body');
      }
    } else if (idx === 0) {
      console.log(
        '[walletkitBridge] No in_msg.message_content.body - keys:',
        tx.in_msg ? Object.keys(tx.in_msg) : 'no in_msg',
      );
    }

    return tx;
  });

  if (processedTransactions.length > 0) {
    console.log('[walletkitBridge] First transaction after processing - hash_hex:', processedTransactions[0].hash_hex);
    console.log(
      '[walletkitBridge] First transaction after processing - in_msg.source_friendly:',
      processedTransactions[0].in_msg?.source_friendly,
    );
    console.log(
      '[walletkitBridge] First transaction after processing - in_msg.comment:',
      processedTransactions[0].in_msg?.comment,
    );
    console.log(
      '[walletkitBridge] First transaction sample:',
      JSON.stringify(processedTransactions[0]).substring(0, 800),
    );
  }
  emitCallCheckpoint(context, 'getRecentTransactions:after-client.getAccountTransactions');
  return { items: Array.isArray(processedTransactions) ? processedTransactions : [] };
}

/**
 * Builds a single-recipient TON transfer and produces an optional preview.
 *
 * @param args - TON transfer parameters including destination, amount, and optional payload.
 * @param context - Diagnostic context for tracing.
 */
export async function createTransferTonTransaction(
  args: CreateTransferTonTransactionArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'createTransferTonTransaction:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'createTransferTonTransaction:after-ensureWalletKitLoaded');
  requireWalletKit();
  emitCallCheckpoint(context, 'createTransferTonTransaction:after-requireWalletKit');

  const walletAddress =
    typeof args.walletAddress === 'string' ? args.walletAddress.trim() : String(args.walletAddress ?? '').trim();
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  const toAddress =
    typeof args.toAddress === 'string' ? args.toAddress.trim() : String(args.toAddress ?? '').trim();
  if (!toAddress) {
    throw new Error('Recipient address is required');
  }

  const amount =
    typeof args.amount === 'string' ? args.amount.trim() : String(args.amount ?? '').trim();
  if (!amount) {
    throw new Error('Amount is required');
  }

  const wallet = walletKit.getWallet?.(walletAddress);
  if (!wallet) {
    throw new Error(`Wallet not found for address ${walletAddress}`);
  }

  const transferParams: Record<string, unknown> = {
    toAddress,
    amount,
  };

  const comment = typeof args.comment === 'string' ? args.comment.trim() : '';
  if (comment) {
    transferParams.comment = comment;
  }

  const body = typeof args.body === 'string' ? args.body.trim() : '';
  if (body) {
    transferParams.body = body;
  }

  const stateInit = typeof args.stateInit === 'string' ? args.stateInit.trim() : '';
  if (stateInit) {
    transferParams.stateInit = stateInit;
  }

  emitCallCheckpoint(context, 'createTransferTonTransaction:before-wallet.createTransferTonTransaction');
  const transaction = await wallet.createTransferTonTransaction(transferParams);
  emitCallCheckpoint(context, 'createTransferTonTransaction:after-wallet.createTransferTonTransaction');

  if (comment && transaction.messages && Array.isArray(transaction.messages)) {
    transaction.messages = transaction.messages.map((msg: any) => ({
      ...msg,
      comment,
    }));
  }

  let preview: unknown = null;
  if (typeof wallet.getTransactionPreview === 'function') {
    try {
      emitCallCheckpoint(context, 'createTransferTonTransaction:before-wallet.getTransactionPreview');
      const previewResult = await wallet.getTransactionPreview(transaction);
      preview = previewResult?.preview ?? previewResult;
      emitCallCheckpoint(context, 'createTransferTonTransaction:after-wallet.getTransactionPreview');
    } catch (error) {
      console.warn('[walletkitBridge] getTransactionPreview failed', error);
    }
  }

  return {
    transaction,
    preview,
  };
}

/**
 * Builds a multi-recipient TON transfer and produces an optional preview.
 *
 * @param args - Wallet address plus an array of transfer messages.
 * @param context - Diagnostic context for tracing.
 */
export async function createTransferMultiTonTransaction(
  args: CreateTransferMultiTonTransactionArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'createTransferMultiTonTransaction:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'createTransferMultiTonTransaction:after-ensureWalletKitLoaded');
  requireWalletKit();

  const walletAddress =
    typeof args.walletAddress === 'string' ? args.walletAddress.trim() : String(args.walletAddress ?? '').trim();
  if (!walletAddress) {
    throw new Error('Wallet address required for multi-transfer transaction');
  }

  const wallet = walletKit.getWallet?.(walletAddress);
  if (!wallet) {
    throw new Error(`Wallet not found: ${walletAddress}`);
  }

  if (!args.messages || !Array.isArray(args.messages) || args.messages.length === 0) {
    throw new Error('At least one message required for multi-transfer transaction');
  }

  const messages = args.messages.map((msg) => {
    const transferParams: Record<string, unknown> = {
      toAddress: msg.toAddress,
      amount: msg.amount,
    };

    if (msg.comment) {
      transferParams.comment = msg.comment;
    }
    if (msg.body) {
      transferParams.body = msg.body;
    }
    if (msg.stateInit) {
      transferParams.stateInit = msg.stateInit;
    }

    return transferParams;
  });

  emitCallCheckpoint(context, 'createTransferMultiTonTransaction:before-wallet.createTransferMultiTonTransaction');
  const transaction = await wallet.createTransferMultiTonTransaction({ messages });
  emitCallCheckpoint(context, 'createTransferMultiTonTransaction:after-wallet.createTransferMultiTonTransaction');

  let preview: unknown = null;
  if (typeof wallet.getTransactionPreview === 'function') {
    try {
      emitCallCheckpoint(context, 'createTransferMultiTonTransaction:before-wallet.getTransactionPreview');
      const previewResult = await wallet.getTransactionPreview(transaction);
      preview = previewResult?.preview ?? previewResult;
      emitCallCheckpoint(context, 'createTransferMultiTonTransaction:after-wallet.getTransactionPreview');
    } catch (error) {
      console.warn('[walletkitBridge] getTransactionPreview failed', error);
    }
  }

  return {
    transaction,
    preview,
  };
}

/**
 * Calculates the fee preview for a transaction previously constructed by the bridge.
 *
 * @param args - Wallet address and serialized transaction content.
 * @param context - Diagnostic context for tracing.
 */
export async function getTransactionPreview(
  args: TransactionContentArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'getTransactionPreview:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'getTransactionPreview:after-ensureWalletKitLoaded');
  requireWalletKit();

  const walletAddress =
    typeof args.walletAddress === 'string' ? args.walletAddress.trim() : String(args.walletAddress ?? '').trim();
  if (!walletAddress) {
    throw new Error('Wallet address required for transaction preview');
  }

  const wallet = walletKit.getWallet?.(walletAddress);
  if (!wallet) {
    throw new Error(`Wallet not found: ${walletAddress}`);
  }

  let transaction: any;
  try {
    transaction = JSON.parse(args.transactionContent);
  } catch (error) {
    throw new Error('Invalid transaction content JSON');
  }

  emitCallCheckpoint(context, 'getTransactionPreview:before-wallet.getTransactionPreview');
  const result = await wallet.getTransactionPreview(transaction);
  emitCallCheckpoint(context, 'getTransactionPreview:after-wallet.getTransactionPreview');

  return result?.preview ?? result;
}

/**
 * Forwards a transaction to WalletKit so it can emit confirmation requests to the native layer.
 *
 * @param args - Wallet address and serialized transaction content.
 * @param context - Diagnostic context for tracing.
 */
export async function handleNewTransaction(
  args: TransactionContentArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'handleNewTransaction:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'handleNewTransaction:after-ensureWalletKitLoaded');
  requireWalletKit();
  emitCallCheckpoint(context, 'handleNewTransaction:after-requireWalletKit');

  const walletAddress =
    typeof args.walletAddress === 'string' ? args.walletAddress.trim() : String(args.walletAddress ?? '').trim();
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  const wallet = walletKit.getWallet?.(walletAddress);
  if (!wallet) {
    throw new Error(`Wallet not found for address ${walletAddress}`);
  }

  let transaction;
  try {
    transaction =
      typeof args.transactionContent === 'string'
        ? JSON.parse(args.transactionContent)
        : args.transactionContent;
  } catch (error) {
    throw new Error(`Invalid transaction content: ${error instanceof Error ? error.message : String(error)}`);
  }

  emitCallCheckpoint(context, 'handleNewTransaction:before-walletKit.handleNewTransaction');
  await walletKit.handleNewTransaction(wallet, transaction);
  emitCallCheckpoint(context, 'handleNewTransaction:after-walletKit.handleNewTransaction');

  return {
    success: true,
  };
}

/**
 * Sends a prepared transaction to the network via WalletKit.
 *
 * @param args - Wallet address and serialized transaction content.
 * @param context - Diagnostic context for tracing.
 */
export async function sendTransaction(
  args: TransactionContentArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'sendTransaction:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'sendTransaction:after-ensureWalletKitLoaded');
  requireWalletKit();
  emitCallCheckpoint(context, 'sendTransaction:after-requireWalletKit');

  const walletAddress =
    typeof args.walletAddress === 'string' ? args.walletAddress.trim() : String(args.walletAddress ?? '').trim();
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  const transactionContent =
    typeof args.transactionContent === 'string' ? args.transactionContent.trim() : String(args.transactionContent ?? '').trim();
  if (!transactionContent) {
    throw new Error('Transaction content is required');
  }

  const wallet = walletKit.getWallet?.(walletAddress);
  if (!wallet) {
    throw new Error(`Wallet not found for address ${walletAddress}`);
  }

  let transaction: any;
  try {
    transaction = JSON.parse(transactionContent);
  } catch (error) {
    throw new Error(`Invalid transaction content JSON: ${error}`);
  }

  emitCallCheckpoint(context, 'sendTransaction:before-wallet.sendTransaction');
  const result = await wallet.sendTransaction(transaction);
  emitCallCheckpoint(context, 'sendTransaction:after-wallet.sendTransaction');

  return {
    signedBoc: result.signedBoc,
  };
}
