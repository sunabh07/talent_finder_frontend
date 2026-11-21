/** Story 2.3 Candidate Details & Management. */

import { ArrowLeft, Download, Mail, MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  downloadCv,
  errorMessage,
  useDeleteCandidateMutation,
  useDeleteCvMutation,
  useGetCandidateQuery,
} from "@/app/api";
import { useSelectedTenantId } from "@/app/hooks";
import { ErrorState } from "@/components/DataTable";
import { PageHeader } from "@/components/Layout";
import { Badge, Button, Card, Modal } from "@/components/ui";

export function CandidateDetailPage() {
  const { id } = useParams();
  const candidateId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const tenantId = useSelectedTenantId();

  const { data: candidate, isLoading, isError, error, refetch } =
    useGetCandidateQuery(candidateId);
  const [deleteCandidate] = useDeleteCandidateMutation();
  const [deleteCv] = useDeleteCvMutation();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(
    // Set when the form saved the candidate but the CV upload failed.
    (location.state as { cvError?: string } | null)?.cvError ?? null,
  );

  async function handleDownload() {
    if (!candidate?.cv_filename || tenantId == null) return;
    try {
      await downloadCv(candidate.id, tenantId, candidate.cv_filename);
    } catch {
      setActionError("Could not download the CV.");
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </Card>
    );
  }

  if (isError || !candidate) {
    return (
      <Card>
        <ErrorState
          message={errorMessage(error, "This candidate does not exist in the selected tenant.")}
          onRetry={() => void refetch()}
        />
      </Card>
    );
  }

  return (
    <>
      <button
        onClick={() => navigate("/candidates")}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={15} /> All candidates
      </button>

      <PageHeader
        title={candidate.full_name}
        description={candidate.current_role ?? undefined}
        showTenant={false}
        action={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate(`/candidates/${candidate.id}/edit`)}
            >
              <Pencil size={15} /> Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> Delete
            </Button>
          </>
        }
      />

      {actionError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          {actionError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Profile</h2>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Detail label="Location" icon={<MapPin size={14} />} value={candidate.location} />
              <Detail
                label="Total experience"
                value={`${Number(candidate.total_experience_years)} years`}
              />
              <Detail label="Email" icon={<Mail size={14} />} value={candidate.email} />
              <Detail label="Phone" icon={<Phone size={14} />} value={candidate.phone} />
            </dl>
            {candidate.professional_summary && (
              <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
                {candidate.professional_summary}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Skills <span className="font-normal text-slate-400">({candidate.skills.length})</span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-md bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Shortlisted for</h2>
            {candidate.submissions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Not shortlisted for any job order yet. Shortlisting happens from a Job Order's
                matching candidates list.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {candidate.submissions.map((submission) => (
                  <li
                    key={submission.submission_id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/job-orders/${submission.job_order_id}`}
                        className="text-sm font-medium text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {submission.job_title}
                      </Link>
                      {submission.client_name && (
                        <p className="truncate text-xs text-slate-500">
                          {submission.client_name}
                        </p>
                      )}
                    </div>
                    <Badge tone="brand">{submission.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">CV</h2>
            {candidate.has_cv ? (
              <>
                <p className="truncate text-sm font-medium text-slate-800">
                  {candidate.cv_filename}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {((candidate.cv_size_bytes ?? 0) / 1024).toFixed(0)} KB
                </p>
                <Button className="mt-3 w-full" variant="secondary" onClick={handleDownload}>
                  <Download size={15} /> Download CV
                </Button>
                <button
                  onClick={async () => {
                    try {
                      await deleteCv(candidate.id).unwrap();
                    } catch (caught) {
                      setActionError(errorMessage(caught, "Could not remove the CV."));
                    }
                  }}
                  className="mt-2 w-full rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                >
                  Remove CV
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500">No CV on file.</p>
                <Button
                  className="mt-3 w-full"
                  variant="secondary"
                  onClick={() => navigate(`/candidates/${candidate.id}/edit`)}
                >
                  Upload a CV
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete candidate"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  await deleteCandidate(candidate.id).unwrap();
                  navigate("/candidates");
                } catch (caught) {
                  setConfirmDelete(false);
                  setActionError(errorMessage(caught, "Could not delete this candidate."));
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium text-slate-900">{candidate.full_name}</span>? Their
          CV and any shortlist records are removed too. This cannot be undone.
        </p>
      </Modal>
    </>
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
