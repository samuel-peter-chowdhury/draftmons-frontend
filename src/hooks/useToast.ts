export type ToastVariant = 'success' | 'error';

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
}

// Singleton external store — no React context needed
let toasts: ToastData[] = [];
const listeners = new Set<(toasts: ToastData[]) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function addToast(message: string, variant: ToastVariant = 'success'): void {
  const id = Math.random().toString(36).slice(2, 9);
  toasts = [...toasts, { id, message, variant }];
  notifyListeners();

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    dismissToast(id);
  }, 4000);
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

// Stable references for useSyncExternalStore — must not be recreated per render
const subscribe = (listener: (toasts: ToastData[]) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => toasts;

const EMPTY: ToastData[] = [];
const getServerSnapshot = () => EMPTY;

export function useToastStore() {
  return { subscribe, getSnapshot, getServerSnapshot };
}
