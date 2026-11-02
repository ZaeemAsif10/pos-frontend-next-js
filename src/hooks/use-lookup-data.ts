"use client";

import { useState, useEffect, useCallback } from "react";
import { memoryCache } from "@/lib/cache";
import { useAppEventListener, type AppEntity } from "@/lib/events";
import { productService, type CategoryItem, type BrandItem } from "@/services/product.service";
import { branchService, type BranchItem } from "@/services/branch.service";
import {
  partyService,
  type DeliveryAreaItem,
  type CustomerItem,
  type SupplierItem,
} from "@/services/party.service";

export type LookupEntity =
  | "categories"
  | "brands"
  | "branches"
  | "routes"
  | "suppliers"
  | "customers";

interface LookupEntityMap {
  categories: CategoryItem[];
  brands: BrandItem[];
  branches: BranchItem[];
  routes: DeliveryAreaItem[];
  suppliers: SupplierItem[];
  customers: CustomerItem[];
}

/**
 * High-performance hook for reactive lookup data (Categories, Brands, Branches, Routes, Suppliers, Customers).
 * - Instant rendering from in-memory cache (0ms delay).
 * - Listens to global events: when any item is added/edited/deleted, automatically refetches and updates!
 */
export function useLookupData<K extends LookupEntity>(entity: K) {
  const [data, setData] = useState<LookupEntityMap[K]>(() => {
    return (
      memoryCache.get<LookupEntityMap[K]>(entity) ||
      ([] as unknown as LookupEntityMap[K])
    );
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !memoryCache.get<LookupEntityMap[K]>(entity);
  });

  const fetchEntityData = useCallback(
    async (bypassCache = false) => {
      if (!bypassCache) {
        const cached = memoryCache.get<LookupEntityMap[K]>(entity);
        if (cached) {
          setData(cached);
          setIsLoading(false);
          return cached;
        }
      }

      try {
        setIsLoading(true);
        let result: any = [];

        switch (entity) {
          case "categories":
            result = await productService.listCategories().catch(() => []);
            break;
          case "brands":
            result = await productService.listBrands().catch(() => []);
            break;
          case "branches": {
            const res = await branchService
              .listBranches()
              .catch(() => ({ branches: [] }));
            result = res.branches || [];
            break;
          }
          case "routes":
            result = await partyService.listDeliveryAreas().catch(() => []);
            break;
          case "suppliers": {
            const res = await partyService
              .listSuppliers({ size: 300 })
              .catch(() => ({ items: [] }));
            result = Array.isArray(res) ? res : res.items || [];
            break;
          }
          case "customers": {
            const res = await partyService
              .listCustomers({ size: 300 })
              .catch(() => ({ items: [] }));
            result = Array.isArray(res) ? res : res.items || [];
            break;
          }
        }

        memoryCache.set(entity, result);
        setData(result);
        return result;
      } catch (err) {
        console.warn(`Failed to fetch lookup data for '${entity}':`, err);
      } finally {
        setIsLoading(false);
      }
    },
    [entity]
  );

  // Initial load
  useEffect(() => {
    fetchEntityData();
  }, [fetchEntityData]);

  // Auto-update whenever an item of this entity changes anywhere in the app!
  useAppEventListener(`${entity}:changed`, () => {
    fetchEntityData(true);
  });

  return {
    data,
    isLoading,
    refetch: () => fetchEntityData(true),
  };
}
