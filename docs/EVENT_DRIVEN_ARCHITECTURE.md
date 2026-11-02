# Paperless Event-Driven Reactive UI & Smart Caching Architecture

## Core Philosophy
In Paperless (an enterprise POS, Invoicing, and Inventory system), user experience must feel instant (0ms delay on navigation) while guaranteeing 100% data freshness and consistency. 
Whenever an entity is created, modified, or deleted anywhere in the UI (e.g. quick modal, standard form, POS transaction), all components displaying that data (tables, dropdowns, KPI cards) MUST automatically react and update without requiring manual page reloads or stale cache bugs.

---

## Architecture Components

### 1. Global Type-Safe App Event Bus (`src/lib/events.ts`)
A lightweight, zero-dependency event emitter using standard browser CustomEvents.

Supported Entities:
- `categories`: Product categories
- `brands`: Product brands
- `branches`: Physical shops, godowns, depots
- `routes`: Delivery areas / routes
- `customers`: Client accounts, credit limits, balances
- `suppliers`: Vendors, payables, mills
- `products`: Master item catalogue, stock quantities
- `invoices`: Sales records, receipts, FBR sync
- `purchases`: Purchase orders, vendor GRNs
- `inventory`: Stock balances, godown transfers, adjustments

Operations:
- `emitAppEvent(event, action?, payload?)`
- `useAppEventListener(event, callback)`

---

### 2. In-Memory Reactive Cache Store (`src/lib/cache.ts`)
- **Lookup Data (Categories, Brands, Branches, Routes, Suppliers, Customers):** Cached with 5–10 minute TTL.
- **Event-Driven Auto-Invalidation:** When `suppliers:changed` or any other entity event is emitted, that entity's cache is purged automatically, triggering an immediate background update for all active subscribers.
- **Stale-While-Revalidate:** Instant UI rendering from memory cache with fresh background sync.

---

### 3. Reactive Lookup Hook (`src/hooks/use-lookup-data.ts`)
Standardized hook used across all pages and modals:
```tsx
const { data: categories, isLoading } = useLookupData("categories");
const { data: brands } = useLookupData("brands");
const { data: branches } = useLookupData("branches");
const { data: routes } = useLookupData("routes");
const { data: suppliers } = useLookupData("suppliers");
const { data: customers } = useLookupData("customers");
```

---

### 4. Mutation Integration Across All Services
Whenever any service method creates, edits, or deletes an item, it dispatches the corresponding event:
- `productService.createCategory()` -> `emitAppEvent("categories:changed")`
- `productService.createBrand()` -> `emitAppEvent("brands:changed")`
- `productService.createProduct()` -> `emitAppEvent("products:changed")`
- `branchService.createBranch()` -> `emitAppEvent("branches:changed")`
- `partyService.createDeliveryArea()` -> `emitAppEvent("routes:changed")`
- `partyService.createCustomer()` -> `emitAppEvent("customers:changed")`
- `partyService.createSupplier()` -> `emitAppEvent("suppliers:changed")`
- `inventoryService.createPurchase()` -> `emitAppEvent("purchases:changed")`, `emitAppEvent("inventory:changed")`, `emitAppEvent("products:changed")`
- `inventoryService.createStockTransfer()` -> `emitAppEvent("inventory:changed")`, `emitAppEvent("products:changed")`
- `salesService.checkout()` -> `emitAppEvent("invoices:changed")`, `emitAppEvent("inventory:changed")`, `emitAppEvent("products:changed")`, `emitAppEvent("customers:changed")`

---

### 5. Reactive Page Subscriptions
All main application screens now actively listen for data changes and auto-update:
- `CategoriesPage`: Listens to `categories:changed`
- `BrandsPage`: Listens to `brands:changed`
- `BranchesPage`: Listens to `branches:changed`
- `RoutesPage`: Listens to `routes:changed`
- `SuppliersPage`: Listens to `suppliers:changed`
- `CustomersPage`: Listens to `customers:changed`
- `ProductsPage`: Listens to `products:changed`, `categories:changed`, `brands:changed`, `branches:changed`
- `PurchasesPage`: Listens to `purchases:changed`, `suppliers:changed`, `branches:changed`, `products:changed`
- `InventoryPage`: Listens to `inventory:changed`, `products:changed`, `branches:changed`, `categories:changed`, `brands:changed`
- `InvoicesPage`: Listens to `invoices:changed`
- `POSCounterPage`: Listens to `products:changed`, `categories:changed`, `branches:changed`, `customers:changed`, `inventory:changed`

---

## Developer Guidelines
1. **Never copy-paste raw fetch loops** for lookup dropdowns across pages. Always use `useLookupData(entity)`.
2. **Never force full browser reload (`window.location.reload()`)** to refresh UI after modal submits. Emit the entity changed event instead.
3. **Keep table queries paginated and separate** from lookup caches. Tables use server-side pagination with offset/limit, while dropdowns use lookup caches.
