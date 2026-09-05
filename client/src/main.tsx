import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '4px',
            background: '#FBFCFE',
            color: '#1A1D24',
            border: '1px solid #C6CBD4',
            fontSize: '13px',
            boxShadow: '0 2px 8px rgba(26,29,36,0.08)',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
