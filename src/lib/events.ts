"use client";

import { useEffect } from "react";

export type AppEntity =
  | "categories"
  | "brands"
  | "branches"
  | "routes"
  | "customers"
  | "suppliers"
  | "products"
  | "invoices"
  | "purchases"
  | "inventory";

export type AppEventName = `${AppEntity}:changed`;

export interface AppEventDetail<T = any> {
  entity: AppEntity;
  action?: "created" | "updated" | "deleted";
  data?: T;
  timestamp: number;
}

const EVENT_PREFIX = "paperless:";

/**
 * Emit a global app event when data is created, updated, or deleted anywhere.
 * This notifies all listening dropdowns, tables, and caches to update immediately.
 */
export function emitAppEvent<T = any>(
  event: AppEventName,
  action?: "created" | "updated" | "deleted",
  data?: T
) {
  if (typeof window === "undefined") return;

  const entity = event.split(":")[0] as AppEntity;
  const detail: AppEventDetail<T> = {
    entity,
    action,
    data,
    timestamp: Date.now(),
  };

  const customEvent = new CustomEvent(`${EVENT_PREFIX}${event}`, {
    detail,
  });

  window.dispatchEvent(customEvent);
}

/**
 * React hook to listen for specific global app events and trigger a callback.
 */
export function useAppEventListener(
  event: AppEventName | AppEventName[],
  callback: (detail: AppEventDetail) => void
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const events = Array.isArray(event) ? event : [event];

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<AppEventDetail>;
      callback(customEvent.detail);
    };

    events.forEach((ev) => {
      window.addEventListener(`${EVENT_PREFIX}${ev}`, handler);
    });

    return () => {
      events.forEach((ev) => {
        window.removeEventListener(`${EVENT_PREFIX}${ev}`, handler);
      });
    };
  }, [event, callback]);
}
