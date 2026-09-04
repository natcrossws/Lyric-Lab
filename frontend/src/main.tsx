import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import theme from '@/core/theme/theme';
import { preApplyThemeFromStorage } from '@/core/theme/dynamicTheme';

import { AuthProvider } from '@/core/context/AuthContext';

// Inject CSS variables from localStorage synchronously before React builds the component tree
preApplyThemeFromStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);

