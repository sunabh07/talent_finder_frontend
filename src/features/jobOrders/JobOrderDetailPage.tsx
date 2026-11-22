/**
 * Story 3.3 Job Order Details & Matching Candidates, and 3.4 Shortlist.
 *
 * This is the screen the whole product exists for. Two decisions shape it:
 *
 * 1. **The ranking is presented, never re-sorted.** There is no sort control
 *    on the matching list, because the backend's order *is* the answer. Rank
 *    numbers are rendered so the ordering is legible at a glance.
 * 2. **Experience eligibility is shown next to the count, not mixed into it.**
 *    A candidate below the minimum still appears, in their earned position,
 *    with a quiet "below min experience" note. The recruiter decides.
 */

import {
  ArrowLeft,
  Briefcase,
  Check,
  MapPin,
  Pencil,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  errorMessage,
  useGetJobOrderQuery,
  useJobOrderMatchesQuery,
  useShowJobCvEvidenceMutation,
  useShortlistMutation,
} from "@/app/api";
import { useSelectedTenantId } from "@/app/hooks";
import { useListControls } from "@/app/useListControls";
import { EmptyState, ErrorState, TableFooter } from "@/components/DataTable";
import { PageHeader } from "@/components/Layout";
import { Badge, Button, Card } from "@/components/ui";
import type { JobCvEvidence, MatchedCandidate } from "@/types";

export function JobOrderDetailPage() {
  const { id } = useParams();
  const tenantId = useSelectedTenantId();
  return <JobOrderDetails key={`${tenantId}:${id}`} jobOrderId={Number(id)} />;
}

function JobOrderDetails({ jobOrderId }: { jobOrderId: number }) {
  const navigate = useNavigate();

  const job = useGetJobOrderQuery(jobOrderId);
  // Matching has no sort control: the ranking is specified, not chosen.
  const controls = useListControls("");
  const matches = useJobOrderMatchesQuery({
    id: jobOrderId,
    params: { page: controls.page, page_size: 10 },
  });

  const [shortlist] = useShortlistMutation();
  const [showEvidence, evidence] = useShowJobCvEvidenceMutation();
  const [busyCandidateId, setBusyCandidateId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleShortlist(candidate: MatchedCandidate) {
    setActionError(null);
    setBusyCandidateId(candidate.candidate_id);
    try {
      await shortlist({ jobOrderId, candidateId: candidate.candidate_id }).unwrap();
      // No manual refetch: the mutation invalidates the JobOrder and
      // Submission tags, so this list, the shortlisted section below and the
      // Submission List all refresh themselves.
    } catch (caught) {
      setActionError(errorMessage(caught, "Could not shortlist this candidate."));
    } finally {
      setBusyCandidateId(null);
    }
  }

  if (job.isLoading) {
    return (
      <Card className="p-6">
        <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-100" />
      </Card>
    );
  }

  if (job.isError || !job.data) {
    return (
      <Card>
        <ErrorState
          message={errorMessage(job.error, "This job order does not exist in the selected tenant.")}
          onRetry={() => void job.refetch()}
        />
      </Card>
    );
  }

  const data = job.data;
  const matchPage = matches.currentData;
  const pageEvidence = evidence.originalArgs?.page === matchPage?.page ? evidence : undefined;

  return (
    <>
      <button
        onClick={() => navigate("/job-orders")}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={15} /> All job orders
      </button>

      <PageHeader
        title={data.job_title}
        description={data.client_name ?? undefined}
        showTenant={false}
        action={
          <>
            <Badge tone={data.status === "Open" ? "success" : "neutral"}>{data.status}</Badge>
            <Button variant="secondary" onClick={() => navigate(`/job-orders/${data.id}/edit`)}>
              <Pencil size={15} /> Edit
            </Button>
          </>
        }
      />

      {actionError && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {actionError}
        </div>
      )}

      {/* --- Job information --- */}
      <Card className="p-5">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Location" icon={<MapPin size={14} />} value={data.location} />
          <Detail
            label="Min experience"
            value={`${Number(data.min_experience_years)} years`}
          />
          <Detail
            label="Openings"
            icon={<Users size={14} />}
            value={String(data.number_of_openings)}
          />
          <Detail
            label="Client"
            icon={<Briefcase size={14} />}
            value={data.client_name}
          />
        </dl>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Required skills ({data.required_skills.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.required_skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-md bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        {data.job_description && (
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
            {data.job_description}
          </p>
        )}
      </Card>

      {/* --- Matching candidates --- */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Matching Candidates</h2>
          <p className="text-sm text-slate-500">
            Same tenant only · ranked by matched skills · candidates with no match are excluded
          </p>
        </div>
        {matchPage && matchPage.items.length > 0 && !matches.isFetching && (
          <div className="mb-3 space-y-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={Boolean(evidence.isLoading)}
              onClick={() => void showEvidence({ id: jobOrderId, page: matchPage.page })}
            >
              {pageEvidence?.isLoading ? "Checking CV evidence…" : "Show AI suggestions"}
            </Button>
            {pageEvidence?.isError && (
              <p role="alert" className="text-sm text-rose-700">{errorMessage(pageEvidence.error)}</p>
            )}
            {pageEvidence?.data?.length === 0 && (
              <p role="status" className="text-sm text-slate-600">
                No suggestions for these matches. Suggestions require relevant work described in a CV.
              </p>
            )}
          </div>
        )}

        <Card className="overflow-hidden">
          {matches.isError ? (
            <ErrorState
              message={errorMessage(matches.error)}
              onRetry={() => void matches.refetch()}
            />
          ) : matches.isFetching ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : matchPage && matchPage.items.length > 0 ? (
            <>
              <ul className="divide-y divide-slate-100">
                {matchPage.items.map((candidate, index) => (
                  <MatchRow
                    key={candidate.candidate_id}
                    candidate={candidate}
                    rank={(matchPage.page - 1) * matchPage.page_size + index + 1}
                    requiredCount={matchPage.summary.required_skill_count}
                    busy={busyCandidateId === candidate.candidate_id}
                    suggestion={pageEvidence?.data?.find(
                      (note) => note.candidate_id === candidate.candidate_id,
                    )}
                    onShortlist={() => handleShortlist(candidate)}
                  />
                ))}
              </ul>
              <TableFooter
                total={matchPage.total}
                page={matchPage.page}
                pageSize={matchPage.page_size}
                totalPages={matchPage.total_pages}
                onPageChange={controls.setPage}
              />
            </>
          ) : (
            <EmptyState
              title="No matching candidates"
              description="No candidate in this tenant shares any of the required skills. Add candidates, or broaden the skills on this job order."
              action={
                <Button variant="secondary" onClick={() => navigate("/candidates/new")}>
                  Add Candidate
                </Button>
              }
            />
          )}
        </Card>
      </div>

      {/* --- Shortlisted candidates --- */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Shortlisted Candidates{" "}
          <span className="font-normal text-slate-400">({data.shortlisted.length})</span>
        </h2>
        <Card className="overflow-hidden">
          {data.shortlisted.length === 0 ? (
            <EmptyState
              title="Nobody shortlisted yet"
              description="Use the Shortlist button on a matching candidate above."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.shortlisted.map((row) => (
                <li
                  key={row.submission_id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/candidates/${row.candidate_id}`}
                      className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                    >
                      {row.full_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {row.current_role ? `${row.current_role} · ` : ""}
                      {row.location} · {Number(row.total_experience_years)} yrs
                    </p>
                  </div>
                  <Badge tone="brand">{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function MatchRow({
  candidate,
  rank,
  requiredCount,
  busy,
  suggestion,
  onShortlist,
}: {
  candidate: MatchedCandidate;
  rank: number;
  requiredCount: number;
  busy: boolean;
  suggestion?: JobCvEvidence;
  onShortlist: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      {/* Rank makes the ordering legible without reading the counts. */}
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold tabular-nums text-slate-600">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/candidates/${candidate.candidate_id}`}
            className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
          >
            {candidate.full_name}
          </Link>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {candidate.match_count} of {requiredCount} skills
          </span>
          {!candidate.meets_min_experience && (
            <span
              title="Shown anyway — experience never affects ranking"
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
            >
              <TriangleAlert size={11} /> Below min experience
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-slate-500">
          {candidate.current_role ? `${candidate.current_role} · ` : ""}
          {candidate.location} · {Number(candidate.total_experience_years)} yrs
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {candidate.matched_skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
            >
              {skill}
            </span>
          ))}
        </div>
        {suggestion && (
          <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p><strong>AI suggestion</strong> · Relevant to <q>{suggestion.job_requirement}</q></p>
            <p className="mt-1"><q>{suggestion.excerpt}</q> <span className="text-slate-500">— CV</span></p>
          </div>
        )}
      </div>

      <div className="shrink-0">
        {candidate.is_shortlisted ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <Check size={15} /> Shortlisted
          </span>
        ) : (
          <Button size="sm" onClick={onShortlist} disabled={busy}>
            {busy ? "Shortlisting…" : "Shortlist"}
          </Button>
        )}
      </div>
    </li>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-800">
        {value ? (
          <>
            {icon && <span className="text-slate-400">{icon}</span>}
            {value}
          </>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </dd>
    </div>
  );
}
