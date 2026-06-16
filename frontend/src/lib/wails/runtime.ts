import { Dialogs, Events, Window } from "@wailsio/runtime";

export type EventHandler<T = unknown> = (event: T) => void;
export type Unsubscribe = () => void;

const events = Events as unknown as Record<string, (...args: any[]) => any>;

export const eventsApi = {
  on<T = unknown>(name: string, handler: EventHandler<T>): Unsubscribe {
    const unsubscribe = events.On(name, handler);
    if (typeof unsubscribe === "function") {
      return unsubscribe as Unsubscribe;
    }

    return () => events.Off(name, handler);
  },

  emit(name: string, payload?: unknown) {
    return events.Emit(name, payload);
  },

  off(name: string, handler?: EventHandler) {
    return events.Off(name, handler);
  },
};

export const windowApi = {
  minimise: () => Window.Minimise(),
  maximise: () => Window.Maximise(),
  restore: () => Window.Restore(),
  close: () => Window.Close(),
  isMaximised: () => Window.IsMaximised(),
};

export const dialogsApi = Dialogs;
