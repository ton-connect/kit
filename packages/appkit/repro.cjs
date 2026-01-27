const { AppKit } = require('./dist/index.js');
const { Network } = require('../../walletkit/dist/index.js');
// Or require('@ton/walletkit') if it resolves to local workspace.
// Since we are in packages/appkit, and walletkit is a dependency, it should resolve.

async function main() {
    console.log('Starting repro (CJS)...');
    try {
        const appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {
                    // No API Key, use default
                },
            },
        });

        const client = appKit.networkManager.getClient(Network.mainnet());
        console.log('Client created. Fetching balance...');
        const balance = await client.getBalance('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N');
        console.log('Balance:', balance.toString());
    } catch (e) {
        console.error('Repro Error:', e);
    }
}

main();
