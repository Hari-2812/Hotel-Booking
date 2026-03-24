import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '16px',
              background: '#0f172a',
              color: '#fff',
            },
          }}
        />
          <App />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);
