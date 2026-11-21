/** Story 2.1 Candidate List. */

import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  errorMessage,
  useCandidateStatsQuery,
  useDeleteCandidateMutation,
  useListCandidatesQuery,
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
  { value: "full_name:asc", label: "Name (A–Z)" },
  { value: "full_name:desc", label: "Name (Z–A)" },
  { value: "total_experience_years:desc", label: "Most experience" },
  { value: "total_experience_years:asc", label: "Least experience" },
  { value: "created_at:desc", label: "Newest first" },
  { value: "location:asc", label: "Location" },
];

export function CandidateListPage() {
  const navigate = useNavigate();
  const tenantId = useSelectedTenantId();
  const controls = useListControls("full_name:asc");

  // skip until a tenant is chosen: a request without X-Tenant-ID would 400.
  const list = useListCandidatesQuery(controls.params, { skip: tenantId == null });
  const stats = useCandidateStatsQuery(undefined, { skip: tenantId == null });
  const [deleteCandidate] = useDeleteCandidateMutation();
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const page = list.data;

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteCandidate(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(errorMessage(caught, "Could not delete this candidate."));
    }
  }

  if (tenantId == null) {
    return (
      <>
        <PageHeader title="Candidates" />
        <Card>
          <EmptyState
            title="Select a tenant first"
            description="Candidates belong to a tenant. Create one on the Tenant page, then choose it above."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Your talent pool for the selected tenant."
        action={
          <Button onClick={() => navigate("/candidates/new")}>
            <Plus size={16} /> Add Candidate
          </Button>
        }
      />

      <SummaryCards
        loading={stats.isFetching}
        cards={[
          { label: "Total Candidates", value: stats.data?.total ?? 0 },
          { label: "Added This Week", value: stats.data?.added_this_week ?? 0 },
          { label: "With CV", value: stats.data?.with_cv ?? 0 },
        ]}
      />

      <div className="mt-5">
        <Toolbar
          search={controls.search}
          onSearchChange={controls.setSearch}
          placeholder="Search name, location, role or skill…"
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
              headers={["Name", "Location", "Experience", "Skills", "CV", <span key="a" className="sr-only">Actions</span>]}
            >
              {list.isFetching ? (
                <LoadingRows columns={6} />
              ) : (
                page?.items.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                        className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {candidate.full_name}
                      </button>
                      {candidate.current_role && (
                        <p className="text-xs text-slate-500">{candidate.current_role}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{candidate.location}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {Number(candidate.total_experience_years)} yrs
                    </td>
                    <td className="px-4 py-3">
                      <SkillChips skills={candidate.skills} />
                    </td>
                    <td className="px-4 py-3">
                      {candidate.has_cv ? <Badge tone="brand">Yes</Badge> : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        actions={[
                          { label: "View", onClick: () => navigate(`/candidates/${candidate.id}`) },
                          {
                            label: "Edit",
                            onClick: () => navigate(`/candidates/${candidate.id}/edit`),
                          },
                          {
                            label: "Delete",
                            tone: "danger",
                            onClick: () =>
                              setPendingDelete({
                                id: candidate.id,
                                name: candidate.full_name,
                              }),
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
                  controls.params.q ? "No candidates match that search" : "No candidates yet"
                }
                description={
                  controls.params.q
                    ? "Try a different name, location or skill."
                    : "Add your first candidate to this tenant."
                }
                action={
                  !controls.params.q && (
                    <Button onClick={() => navigate("/candidates/new")}>
                      <Plus size={16} /> Add Candidate
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
        title="Delete candidate"
        onClose={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium text-slate-900">{pendingDelete?.name}</span>? Their
          CV and any shortlist records are removed too. This cannot be undone.
        </p>
        {deleteError && <p className="mt-2 text-sm text-rose-600">{deleteError}</p>}
      </Modal>
    </>
  );
}
