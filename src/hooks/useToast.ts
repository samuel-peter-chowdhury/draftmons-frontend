export type ToastVariant = 'success' | 'error';

export interface ToastAction {
  label: string;
  /** Radix `Toast.Action` requires a screen-reader description of the action. */
  altText: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

// Singleton external store — no React context needed
let toasts: ToastData[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function addToast(
  message: string,
  variant: ToastVariant = 'success',
  action?: ToastAction,
  durationMs = 4000,
): void {
  const id = Math.random().toString(36).slice(2, 9);
  toasts = [...toasts, { id, message, variant, action }];
  notifyListeners();

  // Auto-dismiss (4s by default; pass a longer duration for actionable toasts)
  setTimeout(() => {
    dismissToast(id);
  }, durationMs);
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

const subscribe = (listener: () => void) => {
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
