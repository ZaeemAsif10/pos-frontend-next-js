# Rule: Paperless Event-Driven Reactive UI & Lookup Caching

Follow this architecture in all frontend development tasks in this workspace:

1. **Global Event Bus**: Always emit `emitAppEvent(event)` whenever any entity is created, modified, or deleted.
2. **Lookup Data**: Use `useLookupData(entity)` for Categories, Brands, Branches, and Routes instead of manual useEffect calls.
3. **Auto-Invalidation**: Listening components automatically refetch or refresh state when entity changes.
4. **Table Queries**: Tables use server-side pagination with DataTable, while dropdowns use lookup caches.
5. Refer to `docs/EVENT_DRIVEN_ARCHITECTURE.md` for full implementation details.
