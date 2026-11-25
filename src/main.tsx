import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const WaveApp = lazy(() => import('./WaveApp'));
const showWaves = new URLSearchParams(window.location.search).get('scene') === 'waves';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>{showWaves ? <WaveApp /> : <App />}</Suspense>
  </StrictMode>,
);
