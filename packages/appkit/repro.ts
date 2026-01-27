
import { AppKit } from './src/core/app-kit';
import { Network } from '@ton/walletkit';

async function main() {
    console.log('Starting repro...');
    try {
        const appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {}
            }
        });

        const client = appKit.networkManager.getClient(Network.mainnet());
        console.log('Client created. Fetching balance...');
        const balance = await client.getBalance('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N');
        console.log('Balance:', balance.toString());
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
