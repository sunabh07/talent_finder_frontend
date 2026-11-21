/** Story 3.5 Submission List. */

import { Link } from "react-router-dom";
import {
  errorMessage,
  useListSubmissionsQuery,
  useSubmissionStatsQuery,
} from "@/app/api";
import { useSelectedTenantId } from "@/app/hooks";
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
import { Badge, Card } from "@/components/ui";

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
  { value: "job_title:asc", label: "Job order (A–Z)" },
  { value: "candidate_name:asc", label: "Candidate (A–Z)" },
  { value: "status:asc", label: "Status" },
];

export function SubmissionListPage() {
  const tenantId = useSelectedTenantId();
  const controls = useListControls("created_at:desc");

  const list = useListSubmissionsQuery(controls.params, { skip: tenantId == null });
  const stats = useSubmissionStatsQuery(undefined, { skip: tenantId == null });

  const page = list.data;

  if (tenantId == null) {
    return (
      <>
        <PageHeader title="Submissions" />
        <Card>
          <EmptyState
            title="Select a tenant first"
            description="Submissions belong to a tenant. Choose one above."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Submissions"
        description="Every candidate shortlisted across this tenant's job orders."
      />

      <SummaryCards
        loading={stats.isFetching}
        cards={[
          { label: "Total Submissions", value: stats.data?.total ?? 0 },
          { label: "Added This Week", value: stats.data?.added_this_week ?? 0 },
          { label: "Job Orders Covered", value: stats.data?.job_orders_with_submissions ?? 0 },
        ]}
      />

      <div className="mt-5">
        <Toolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          placeholder="Search job order, client, candidate or status…"
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
            <TableShell headers={["Job Order", "Candidate", "Status", "Shortlisted"]}>
              {list.isFetching ? (
                <LoadingRows columns={4} />
              ) : (
                page?.items.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        to={`/job-orders/${row.job_order_id}`}
                        className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {row.job_title}
                      </Link>
                      {row.client_name && (
                        <p className="text-xs text-slate-500">{row.client_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/candidates/${row.candidate_id}`}
                        className="text-slate-700 hover:text-brand-700 hover:underline"
                      >
                        {row.candidate_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{row.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(row.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </TableShell>

            {!list.isFetching && page?.items.length === 0 && (
              <EmptyState
                title={
                  controls.params.q ? "No submissions match that search" : "No submissions yet"
                }
                description={
                  controls.params.q
                    ? "Try a different job order or candidate name."
                    : "Open a job order and shortlist a matching candidate to create one."
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
    </>
  );
}
