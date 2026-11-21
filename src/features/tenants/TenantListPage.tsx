/** Story 1.1 Tenant List and 1.2 Create Tenant. */

import { Plus } from "lucide-react";
import { useState } from "react";
import { errorMessage, useCreateTenantMutation, useListTenantsQuery, useTenantStatsQuery } from "@/app/api";
import { useListControls } from "@/app/useListControls";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  SummaryCards,
  TableFooter,
  TableShell,
  Toolbar,
} from "@/components/DataTable";
import { PageHeader } from "@/components/Layout";
import { Badge, Button, Card, FieldError, Input, Label, Modal } from "@/components/ui";

const SORT_OPTIONS = [
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "name:desc", label: "Name (Z–A)" },
  { value: "created_at:desc", label: "Newest first" },
  { value: "id:asc", label: "Tenant ID" },
];

export function TenantListPage() {
  const controls = useListControls("name:asc");
  const list = useListTenantsQuery(controls.params);
  const stats = useTenantStatsQuery();
  const [createOpen, setCreateOpen] = useState(false);

  const page = list.data;

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Sourcing channels your recruitment data is segregated by."
        showTenant={false}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create Tenant
          </Button>
        }
      />

      <SummaryCards
        loading={stats.isFetching}
        cards={[
          { label: "Total Tenants", value: stats.data?.total ?? 0 },
          { label: "Active", value: stats.data?.active ?? 0 },
          { label: "Added This Week", value: stats.data?.added_this_week ?? 0 },
        ]}
      />

      <div className="mt-5">
        <Toolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          placeholder="Search by name or ID…"
          sortOptions={SORT_OPTIONS}
          sortValue={controls.sort}
          onSortChange={controls.setSort}
        />
      </div>

      <Card className="mt-4 overflow-hidden">
        {list.isError ? (
          <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()} />
        ) : (
          <>
            <TableShell headers={["Tenant Name", "Tenant ID", "Status"]}>
              {list.isFetching ? (
                <LoadingRows columns={3} />
              ) : page && page.items.length > 0 ? (
                page.items.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{tenant.name}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{tenant.id}</td>
                    <td className="px-4 py-3">
                      <Badge tone={tenant.status === "Active" ? "success" : "neutral"}>
                        {tenant.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : null}
            </TableShell>

            {!list.isFetching && page?.items.length === 0 && (
              <EmptyState
                title={controls.params.q ? "No tenants match that search" : "No tenants yet"}
                description={
                  controls.params.q
                    ? "Try a different name or tenant ID."
                    : "Create your first sourcing channel to start adding candidates."
                }
                action={
                  !controls.params.q && (
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus size={16} /> Create Tenant
                    </Button>
                  )
                }
              />
            )}

            {page && (
              <TableFooter
                total={page.total}
                page={page.page}
                pageSize={page.page_size}
                totalPages={page.total_pages}
                onPageChange={controls.setPage}
              />
            )}
          </>
        )}
      </Card>

      <CreateTenantDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function CreateTenantDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createTenant, { isLoading }] = useCreateTenantMutation();

  function close() {
    setName("");
    setError(null);
    onClose();
  }

  async function submit() {
    if (!name.trim()) {
      setError("Tenant name is required.");
      return;
    }
    try {
      await createTenant({ name: name.trim() }).unwrap();
      close();
    } catch (caught) {
      // Surfaces the backend's 409 for a duplicate name verbatim.
      setError(errorMessage(caught, "Could not create the tenant."));
    }
  }

  return (
    <Modal
      open={open}
      title="Create Tenant"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isLoading}>
            {isLoading ? "Creating…" : "Create Tenant"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Label htmlFor="tenant-name" required>
          Tenant Name
        </Label>
        <Input
          id="tenant-name"
          autoFocus
          value={name}
          invalid={Boolean(error)}
          placeholder="e.g. LinkedIn"
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
        <FieldError>{error}</FieldError>
        <p className="mt-3 text-sm text-slate-500">
          A tenant is a sourcing channel. Candidates and job orders created under it stay
          isolated from every other tenant.
        </p>
      </form>
    </Modal>
  );
}
