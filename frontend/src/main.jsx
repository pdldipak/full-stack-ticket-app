import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@src/App.jsx';
import { AuthProvider } from '@src/context/AuthContext.jsx';
import { ThemeProvider } from '@src/context/ThemeContext.jsx';
import { ErrorBoundary } from '@src/components/ErrorBoundary.jsx';
import '@src/css/index.css';
import { getDocumentTitle } from '@src/config/eventConfig.js';

document.title = getDocumentTitle();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
