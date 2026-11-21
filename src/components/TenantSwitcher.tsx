/**
 * Tenant dropdown shown in the page header.
 *
 * Changing it dispatches `selectTenant`, which the store middleware turns
 * into a full API cache reset - so the next render cannot paint the previous
 * tenant's rows. The component itself does no refetching; that is the data
 * layer's job.
 */

import { Building2 } from "lucide-react";
import { useEffect } from "react";
import { useListTenantsQuery } from "@/app/api";
import { useAppDispatch, useSelectedTenantId } from "@/app/hooks";
import { selectTenant } from "@/app/tenantSlice";

export function TenantSwitcher() {
  const dispatch = useAppDispatch();
  const selectedTenantId = useSelectedTenantId();

  // page_size 100 is the API maximum and comfortably covers a demo dataset.
  // A real deployment would swap this for a searchable async picker.
  const { data, isLoading } = useListTenantsQuery({ page_size: 100, sort_by: "name" });
  const tenants = data?.items ?? [];

  // Auto-select on first load so the app is never stuck in an empty state,
  // and recover if a remembered tenant has since been removed.
  useEffect(() => {
    if (tenants.length === 0) return;
    const stillExists = tenants.some((tenant) => tenant.id === selectedTenantId);
    if (!stillExists) dispatch(selectTenant(tenants[0].id));
  }, [tenants, selectedTenantId, dispatch]);

  return (
    <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-inset ring-slate-300">
      <Building2 size={16} className="shrink-0 text-slate-400" />
      <span className="sr-only">Tenant</span>
      <select
        value={selectedTenantId ?? ""}
        disabled={isLoading || tenants.length === 0}
        onChange={(event) => dispatch(selectTenant(Number(event.target.value)))}
        aria-label="Selected tenant"
        className="cursor-pointer border-0 bg-transparent py-0 pl-0 pr-6 text-sm font-medium text-slate-800 focus:ring-0 disabled:text-slate-400"
      >
        {tenants.length === 0 && <option value="">No tenants yet</option>}
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
