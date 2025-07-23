import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function addToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };

    update(toasts => [...toasts, toast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  function removeToast(id: string) {
    update(toasts => toasts.filter(t => t.id !== id));
  }

  return {
    subscribe,
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
    remove: removeToast
  };
}

export const toast = createToastStore();