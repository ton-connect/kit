import { TonClient, toNano } from '@ton/ton';
import { DEX, dexFactory, pTON } from '@ston-fi/sdk';
import { v4 as uuidv4 } from 'uuid';
import { CPIRouterV2_2 } from '@ston-fi/sdk/dist/contracts/dex/v2_2/index.js';
import { OpenedContract } from '@ton/core';
import { StonApiClient } from '@ston-fi/api';

import { SwapInput, SwapQuote } from '../types/api.js';

export class StonFiService {
    private tonClient: TonClient;

    private router: OpenedContract<CPIRouterV2_2>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private proxyTon: any;

    // STON.fi v2 addresses (testnet)
    private readonly ROUTER_ADDRESS = 'EQBjK_kjY5R_DoyTRff109VzFrSlKFCC_gOOWIMtyEvCcv2J'; // CPI Router v2.1.0
    private readonly PROXY_TON_ADDRESS = 'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S'; // pTON v2.1.0

    constructor() {
        // Use testnet by default (change for mainnet)
        // const isTestnet = process.env.NODE_ENV !== 'production';
        const endpoint = 'https://toncenter.com/api/v2/jsonRPC';

        // Initialize TON client
        this.tonClient = new TonClient({
            endpoint,
            apiKey: process.env.TON_API_KEY,
        });

        // Initialize STON.fi router and proxy TON
        this.router = this.tonClient.open(
            DEX.v2_2.Router.CPI.create(this.ROUTER_ADDRESS),
        ) as OpenedContract<CPIRouterV2_2>;
        // eslint-disable-next-line no-console
        console.log('router', this.ROUTER_ADDRESS, this.router);

        this.proxyTon = pTON.v2_1.create(this.PROXY_TON_ADDRESS);
        // eslint-disable-next-line no-console
        console.log('proxyTon', this.PROXY_TON_ADDRESS, this.proxyTon);
    }

    async getSwapQuote(input: SwapInput): Promise<SwapQuote> {
        try {
            const quoteId = uuidv4();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

            const client = new StonApiClient();
            const simulationResult = await client.simulateSwap({
                offerAddress: input.token_in.address,
                askAddress: input.token_out.address,
                slippageTolerance: '0.01',
                offerUnits: input.amount_in,
            });

            // eslint-disable-next-line no-console
            console.log('simulateSwap result', simulationResult);

            // Determine swap type and get appropriate transaction parameters
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let txParams: any;
            const slippageTolerance = input.slippage_bps ? parseInt(input.slippage_bps) / 10000 : 0.01; // Default 1% slippage

            if (input.token_in.standard === 'ton' && input.token_out.standard === 'jetton') {
                // eslint-disable-next-line no-console
                console.log(
                    'getSwapTonToJettonTxParams',
                    input.wallet_address,
                    this.proxyTon,
                    input.amount_in,
                    input.token_out.address,
                    slippageTolerance,
                );
                const routerMetadata = await client.getRouter(simulationResult.routerAddress);
                const dexContracts = dexFactory(routerMetadata);
                const router = this.tonClient.open(dexContracts.Router.create(routerMetadata.address));

                // TON to Jetton swap
                txParams = await router.getSwapTonToJettonTxParams({
                    userWalletAddress: input.wallet_address,
                    proxyTon: dexContracts.pTON.create(routerMetadata.ptonMasterAddress), //this.proxyTon,
                    offerAmount: BigInt(input.amount_in),
                    askJettonAddress: input.token_out.address,
                    minAskAmount: 0, //this.calculateMinAmount(input.amount_in, slippageTolerance),
                });
                // eslint-disable-next-line no-console
                console.log('got quote, txParams', txParams);
            } else if (input.token_in.standard === 'jetton' && input.token_out.standard === 'ton') {
                // Jetton to TON swap
                txParams = await this.router.getSwapJettonToTonTxParams({
                    userWalletAddress: input.wallet_address,
                    offerJettonAddress: input.token_in.address,
                    offerAmount: BigInt(input.amount_in),
                    minAskAmount: this.calculateMinAmount(input.amount_in, slippageTolerance),
                    proxyTon: this.proxyTon,
                });
            } else if (input.token_in.standard === 'jetton' && input.token_out.standard === 'jetton') {
                // Jetton to Jetton swap
                txParams = await this.router.getSwapJettonToJettonTxParams({
                    userWalletAddress: input.wallet_address,
                    offerJettonAddress: input.token_in.address,
                    offerAmount: BigInt(input.amount_in),
                    askJettonAddress: input.token_out.address,
                    minAskAmount: this.calculateMinAmount(input.amount_in, slippageTolerance),
                });
            } else {
                throw new Error('Invalid token pair for swap');
            }

            // For now, we'll simulate expected output and fees
            // In a real implementation, you'd get this from pool data
            const expectedOut = '0'; //this.estimateOutput(input.amount_in);
            const minOut = '0'; //this.calculateMinAmount(expectedOut, slippageTolerance);

            // Build transaction data immediately
            const buildId = uuidv4();
            const nonce = uuidv4();

            // Handle referral if provided
            let finalTxParams = txParams;
            if (input.referrer) {
                finalTxParams = await this.addReferralToTxParams(input, input.wallet_address, input.referrer);
            }

            const quote: SwapQuote = {
                action_id: 'swap',
                quote_id: quoteId,
                build_id: buildId,
                token_in: input.token_in,
                token_out: input.token_out,
                expected_out: expectedOut,
                min_out: minOut,
                route: [input.token_in.address, input.token_out.address],
                price_impact_bps: this.estimatePriceImpact(input.amount_in),
                fee: this.estimateFee(input.amount_in),
                gas_ton: this.estimateGas(),
                ton_connect: {
                    messages: [
                        {
                            address: finalTxParams.to.toString(),
                            amount: finalTxParams.value.toString(),
                            payload: finalTxParams.body ? finalTxParams.body.toBoc().toString('base64') : '',
                            state_init: finalTxParams.init ? finalTxParams.init.toBoc().toString('base64') : null,
                        },
                    ],
                    valid_until: Math.floor(expiresAt.getTime() / 1000),
                },
                nonce: nonce,
                gasless_used: input.use_gasless || false,
                warnings: this.getWarnings(input),
                expires_at: expiresAt.toISOString(),
            };

            // Store quote and transaction parameters for later use
            this.storeQuote(quoteId, { input, txParams, quote });

            return quote;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error getting swap quote:', error);
            throw new Error(`Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async addReferralToTxParams(
        input: SwapInput,
        userWalletAddress: string,
        referralAddress: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        const referralValue = 10; // 0.1% referral fee
        const slippageTolerance = input.slippage_bps ? parseInt(input.slippage_bps) / 10000 : 0.01;

        if (input.token_in.standard === 'ton' && input.token_out.standard === 'jetton') {
            return await this.router.getSwapTonToJettonTxParams({
                userWalletAddress,
                proxyTon: this.proxyTon,
                offerAmount: BigInt(input.amount_in),
                askJettonAddress: input.token_out.address,
                minAskAmount: this.calculateMinAmount(input.amount_in, slippageTolerance),
                referralAddress,
                referralValue,
            });
        } else if (input.token_in.standard === 'jetton' && input.token_out.standard === 'ton') {
            return await this.router.getSwapJettonToTonTxParams({
                userWalletAddress,
                offerJettonAddress: input.token_in.address,
                offerAmount: BigInt(input.amount_in),
                minAskAmount: this.calculateMinAmount(input.amount_in, slippageTolerance),
                proxyTon: this.proxyTon,
                referralAddress,
                referralValue,
            });
        } else {
            return await this.router.getSwapJettonToJettonTxParams({
                userWalletAddress,
                offerJettonAddress: input.token_in.address,
                offerAmount: BigInt(input.amount_in),
                askJettonAddress: input.token_out.address,
                minAskAmount: this.calculateMinAmount(input.amount_in, slippageTolerance),
                referralAddress,
                referralValue,
            });
        }
    }

    // Helper methods for estimation (simplified for demo)
    private calculateMinAmount(amount: string, slippage: number): string {
        const amountBigInt = BigInt(amount);
        const slippageAmount = (amountBigInt * BigInt(Math.floor(slippage * 10000))) / BigInt(10000);
        return (amountBigInt - slippageAmount).toString();
    }

    private estimateOutput(amountIn: string): string {
        // Simplified estimation - in real implementation, query pool data
        const amount = BigInt(amountIn);
        const estimatedOut = (amount * BigInt(95)) / BigInt(100); // Assume 5% spread
        return estimatedOut.toString();
    }

    private estimatePriceImpact(_amountIn: string): string {
        // Simplified price impact calculation
        return '50'; // 0.5% price impact
    }

    private estimateFee(amountIn: string): string {
        // STON.fi typically charges 0.3% fee
        const amount = BigInt(amountIn);
        const fee = (amount * BigInt(30)) / BigInt(10000); // 0.3%
        return fee.toString();
    }

    private estimateGas(): string {
        // Estimate gas cost in TON (simplified)
        return toNano('0.3').toString(); // ~0.3 TON for gas
    }

    private getWarnings(input: SwapInput): string[] {
        const warnings: string[] = [];

        const amountBigInt = BigInt(input.amount_in);
        if (amountBigInt < BigInt('1000000')) {
            // Less than 0.001 TON
            warnings.push('Small trade amount may result in high slippage');
        }

        if (!input.slippage_bps || parseInt(input.slippage_bps) > 1000) {
            // > 10%
            warnings.push('High slippage tolerance set');
        }

        return warnings;
    }

    // Simple in-memory storage (use Redis in production)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private quotes = new Map<string, any>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private storeQuote(quoteId: string, data: any): void {
        this.quotes.set(quoteId, {
            ...data,
            timestamp: Date.now(),
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private getStoredQuote(quoteId: string): any | null {
        const data = this.quotes.get(quoteId);
        if (!data) return null;

        // Check if quote is expired (5 minutes)
        if (Date.now() - data.timestamp > 5 * 60 * 1000) {
            this.quotes.delete(quoteId);
            return null;
        }

        return data;
    }
}
