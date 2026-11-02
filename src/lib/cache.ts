"use client";

import { type AppEntity } from "./events";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class ReactiveMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  // Default TTL: 5 minutes for lookup data (categories, brands, branches, etc.)
  private defaultTTL = 5 * 60 * 1000;

  constructor() {
    if (typeof window !== "undefined") {
      // Automatically listen for entity changes and purge stale cache
      const entities: AppEntity[] = [
        "categories",
        "brands",
        "branches",
        "routes",
        "customers",
        "suppliers",
        "products",
        "invoices",
        "purchases",
        "inventory",
      ];

      entities.forEach((entity) => {
        window.addEventListener(`paperless:${entity}:changed`, () => {
          this.invalidate(entity);
        });
      });
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultTTL,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new ReactiveMemoryCache();
