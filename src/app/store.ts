import { configureStore, isAnyOf } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";
import { api } from "@/app/api";
import { apiLogger } from "@/app/apiLogger";
import tenantReducer, { selectTenant } from "@/app/tenantSlice";

/**
 * Switching tenants invalidates every tenant-owned cache entry.
 *
 * Without this, RTK Query would serve the previous tenant's cached candidate
 * list under the new tenant - exactly the "stale previous-tenant rows" the
 * acceptance criteria forbid. Doing it here means no screen has to remember
 * to refetch.
 *
 * Only the tenant-scoped tags are invalidated. `resetApiState()` was the
 * first attempt and is wrong twice over: it also drops the tenant list, which
 * is not tenant-scoped and is what the switcher itself renders from, and it
 * aborts in-flight requests - including the ones the switcher's own
 * auto-select had just triggered, leaving those screens stuck on skeletons.
 *
 * Invalidation alone would still briefly paint the old rows while the refetch
 * is in flight, so list screens key their loading state off `isFetching`
 * rather than `isLoading`. The two together are what guarantee a tenant
 * switch never shows another tenant's data.
 */
const invalidateTenantDataOnSwitch: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  if (isAnyOf(selectTenant)(action)) {
    store.dispatch(api.util.invalidateTags(["Candidate", "JobOrder", "Submission"]));
  }
  return result;
};

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    tenant: tenantReducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(api.middleware, apiLogger, invalidateTenantDataOnSwitch),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
