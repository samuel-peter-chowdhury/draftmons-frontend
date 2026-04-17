'use client';

import { useSyncExternalStore } from 'react';
import { useToastStore, dismissToast } from '@/hooks/useToast';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastClose,
} from '@/components/ui/toast';
import type { ToastData } from '@/hooks/useToast';

export function Toaster() {
  const { subscribe, getSnapshot, getServerSnapshot } = useToastStore();
  const toasts: ToastData[] = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onOpenChange={(open) => {
            if (!open) dismissToast(toast.id);
          }}
        >
          <ToastTitle>{toast.message}</ToastTitle>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
