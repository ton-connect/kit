import { toEvent } from './AccountEvent';
import { loadData } from '../../../data';
import { ToncenterTracesResponse } from './emulation';

const traces = loadData<ToncenterTracesResponse>('traces-test');
const account = 'UQC8G3SPXSa3TYV3mP9N1CUqK3nPUbIyrkG-HxnozZVHt2Iv';

describe('AccountEvent', () => {
    it('toEvent 0', async () => {
        const actual = toEvent(traces.traces[0], account);
        expect(actual.actions).toEqual([]); // TODO add test data
    });

    it('toEvent 1', async () => {
        const actual = toEvent(traces.traces[1], account);
        expect(actual.actions).toEqual([]); // TODO add test data
    });
});
