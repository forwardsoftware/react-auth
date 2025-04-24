type EventsMap = Record<string, any>;

export type EventKey<T extends EventsMap> = string & keyof T;

export type EventReceiver<T> = (params: T) => void;

interface Emitter<T extends EventsMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

// TODO: Improve -> `listeners` are unbounded -- don't use this in practice!
export function createEventEmitter<T extends EventsMap>(): Emitter<T> {
  const listeners: {
    [K in keyof EventsMap]?: Array<(p: EventsMap[K]) => void>;
  } = {};

  return {
    on(key, fn) {
      listeners[key] = (listeners[key] || []).concat(fn);
    },
    off(key, fn) {
      listeners[key] = (listeners[key] || []).filter(f => f !== fn);
    },
    emit(key, data) {
      (listeners[key] || []).forEach(function(fn) {
        try {
          fn(data);
        } catch {}
      });
    },
  };
}
