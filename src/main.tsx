import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { flushPending } from './lib/db';
import './index.css';

// Replay any attempts that failed to sync on a previous visit, and retry
// whenever the tab regains focus / connectivity.
void flushPending();
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushPending());
  window.addEventListener('focus', () => void flushPending());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
