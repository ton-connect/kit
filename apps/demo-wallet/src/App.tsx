import { AppRouter } from './components';
import './App.css';
import './storePatch';

import { Toaster } from '@/components/ui/sonner';

function App() {
    return (
        <>
            <AppRouter />
            <Toaster />
        </>
    );
}

export default App;
