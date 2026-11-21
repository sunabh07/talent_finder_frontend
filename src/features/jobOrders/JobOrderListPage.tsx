/** Story 3.1 Job Order List. */

import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  errorMessage,
  useDeleteJobOrderMutation,
  useJobOrderStatsQuery,
  useListJobOrdersQuery,
} from "@/app/api";
import { useSelectedTenantId } from "@/app/hooks";
import { useListControls } from "@/app/useListControls";
import {
  ActionMenu,
  EmptyState,
  ErrorState,
  LoadingRows,
  SkillChips,
  SummaryCards,
  TableFooter,
  TableShell,
  Toolbar,
} from "@/components/DataTable";
import { PageHeader } from "@/components/Layout";
import { Badge, Button, Card, Modal } from "@/components/ui";

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "job_title:asc", label: "Title (A–Z)" },
  { value: "job_title:desc", label: "Title (Z–A)" },
  { value: "min_experience_years:desc", label: "Most experience required" },
  { value: "number_of_openings:desc", label: "Most openings" },
  { value: "status:asc", label: "Status" },
];

export function JobOrderListPage() {
  const navigate = useNavigate();
  const tenantId = useSelectedTenantId();
  const controls = useListControls("created_at:desc");

  const list = useListJobOrdersQuery(controls.params, { skip: tenantId == null });
  const stats = useJobOrderStatsQuery(undefined, { skip: tenantId == null });
  const [deleteJobOrder] = useDeleteJobOrderMutation();

  const [pendingDelete, setPendingDelete] = useState<{ id: number; title: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const page = list.data;

  if (tenantId == null) {
    return (
      <>
        <PageHeader title="Job Orders" />
        <Card>
          <EmptyState
            title="Select a tenant first"
            description="Job orders belong to a tenant. Create one on the Tenant page, then choose it above."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Job Orders"
        description="Roles you are hiring for in the selected tenant."
        action={
          <Button onClick={() => navigate("/job-orders/new")}>
            <Plus size={16} /> Add Job Order
          </Button>
        }
      />

      <SummaryCards
        loading={stats.isFetching}
        cards={[
          { label: "Total Job Orders", value: stats.data?.total ?? 0 },
          { label: "Open", value: stats.data?.open ?? 0 },
          { label: "Open Positions", value: stats.data?.total_openings ?? 0 },
        ]}
      />

      <div className="mt-5">
        <Toolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          placeholder="Search title, client, location or skill…"
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
            <TableShell
              headers={[
                "Job Title",
                "Client",
                "Location",
                "Min Exp",
                "Openings",
                "Required Skills",
                "Status",
                <span key="a" className="sr-only">
                  Actions
                </span>,
              ]}
            >
              {list.isFetching ? (
                <LoadingRows columns={8} />
              ) : (
                page?.items.map((job) => (
                  <tr key={job.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/job-orders/${job.id}`)}
                        className="text-left font-medium text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {job.job_title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {job.client_name ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{job.location}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {Number(job.min_experience_years)} yrs
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {job.number_of_openings}
                    </td>
                    <td className="px-4 py-3">
                      <SkillChips skills={job.required_skills} max={3} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={job.status === "Open" ? "success" : "neutral"}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        actions={[
                          { label: "View", onClick: () => navigate(`/job-orders/${job.id}`) },
                          {
                            label: "Edit",
                            onClick: () => navigate(`/job-orders/${job.id}/edit`),
                          },
                          {
                            label: "Delete",
                            tone: "danger",
                            onClick: () =>
                              setPendingDelete({ id: job.id, title: job.job_title }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </TableShell>

            {!list.isFetching && page?.items.length === 0 && (
              <EmptyState
                title={
                  controls.params.q ? "No job orders match that search" : "No job orders yet"
                }
                description={
                  controls.params.q
                    ? "Try a different title, client or skill."
                    : "Create a job order to see ranked matching candidates from your talent pool."
                }
                action={
                  !controls.params.q && (
                    <Button onClick={() => navigate("/job-orders/new")}>
                      <Plus size={16} /> Add Job Order
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

      <Modal
        open={pendingDelete !== null}
        title="Delete job order"
        onClose={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  await deleteJobOrder(pendingDelete.id).unwrap();
                  setPendingDelete(null);
                } catch (caught) {
                  setDeleteError(errorMessage(caught, "Could not delete this job order."));
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium text-slate-900">{pendingDelete?.title}</span>? Any
          candidates shortlisted against it lose their submission record. This cannot be undone.
        </p>
        {deleteError && <p className="mt-2 text-sm text-rose-600">{deleteError}</p>}
      </Modal>
    </>
  );
}
