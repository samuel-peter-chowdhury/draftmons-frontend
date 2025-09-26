'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ColorModeProvider } from '@/contexts/ColorModeContext';
import { authStatus } from '@/store/slices/authSlice';
import './globals.css';
import { useAppDispatch } from '../store/hooks';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // Check auth status on app load
    dispatch(authStatus());
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