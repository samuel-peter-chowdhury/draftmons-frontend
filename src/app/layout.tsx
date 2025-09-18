'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ColorModeProvider } from '@/contexts/ColorModeContext';
import { hydrateAuth } from '@/store/slices/authSlice';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hydrate auth on app load
    store.dispatch(hydrateAuth());
  }, []);

  return (
    <html lang="en">
      <body id="__next">
        <Provider store={store}>
          <ColorModeProvider>
            {children}
          </ColorModeProvider>
        </Provider>
      </body>
    </html>
  );
}