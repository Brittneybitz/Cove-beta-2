import { LoadingManager } from 'three';
const manager = new LoadingManager();
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.innerText = `Loading: ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
  }
};
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
