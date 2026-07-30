'use client';

import { useSyncExternalStore } from 'react';
import { useToastStore, dismissToast } from '@/hooks/useToast';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastAction,
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
          {toast.action && (
            <ToastAction
              altText={toast.action.altText}
              onClick={() => {
                toast.action!.onClick();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </ToastAction>
          )}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
