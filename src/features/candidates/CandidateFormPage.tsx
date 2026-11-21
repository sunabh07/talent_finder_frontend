/**
 * Story 2.2 Create Candidate, and the edit form from Story 2.3.
 *
 * The CV control sits at the top of the form as the brief specifies. In this
 * build it attaches the file after save - the candidate must exist before it
 * can own a CV. Story 7 adds parse-and-prefill in front of it, which is why
 * the control is positioned first even though it is the last thing sent.
 */

import { ArrowLeft, Paperclip, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  errorMessage,
  useCreateCandidateMutation,
  useGetCandidateQuery,
  useUpdateCandidateMutation,
  useUploadCvMutation,
} from "@/app/api";
import { useSelectedTenantId } from "@/app/hooks";
import { PageHeader } from "@/components/Layout";
import { Button, Card, FieldError, Input, Label, Textarea } from "@/components/ui";
import { SkillInput } from "@/components/SkillInput";

interface FormState {
  full_name: string;
  location: string;
  total_experience_years: string;
  skills: string[];
  email: string;
  phone: string;
  current_role: string;
  professional_summary: string;
}

const EMPTY: FormState = {
  full_name: "",
  location: "",
  total_experience_years: "",
  skills: [],
  email: "",
  phone: "",
  current_role: "",
  professional_summary: "",
};

const MAX_CV_MB = 10;

export function CandidateFormPage() {
  const { id } = useParams();
  const candidateId = id ? Number(id) : null;
  const isEdit = candidateId !== null;

  const navigate = useNavigate();
  const tenantId = useSelectedTenantId();

  const existing = useGetCandidateQuery(candidateId as number, { skip: !isEdit });
  const [createCandidate, createState] = useCreateCandidateMutation();
  const [updateCandidate, updateState] = useUpdateCandidateMutation();
  const [uploadCv] = useUploadCvMutation();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [cvWarning, setCvWarning] = useState<string | null>(null);

  // Populate once the existing record arrives.
  useEffect(() => {
    const candidate = existing.data;
    if (!candidate) return;
    setForm({
      full_name: candidate.full_name,
      location: candidate.location,
      total_experience_years: String(Number(candidate.total_experience_years)),
      skills: candidate.skills.map((skill) => skill.name),
      email: candidate.email ?? "",
      phone: candidate.phone ?? "",
      current_role: candidate.current_role ?? "",
      professional_summary: candidate.professional_summary ?? "",
    });
  }, [existing.data]);

  const saving = createState.isLoading || updateState.isLoading;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  /** Client-side mirror of the server rules, for immediate feedback only. */
  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim()) errors.full_name = "Full name is required.";
    if (!form.location.trim()) errors.location = "Location is required.";

    const years = Number(form.total_experience_years);
    if (form.total_experience_years === "" || Number.isNaN(years)) {
      errors.total_experience_years = "Total experience is required.";
    } else if (years < 0 || years > 60) {
      errors.total_experience_years = "Enter a value between 0 and 60.";
    }
    if (form.skills.length === 0) errors.skills = "Add at least one skill.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function pickFile(file: File | null) {
    setCvWarning(null);
    if (!file) {
      setCvFile(null);
      return;
    }
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".pdf", ".docx"].includes(extension)) {
      setCvWarning("Only .pdf and .docx files are accepted.");
      return;
    }
    if (file.size > MAX_CV_MB * 1024 * 1024) {
      setCvWarning(`Files must be ${MAX_CV_MB} MB or smaller.`);
      return;
    }
    setCvFile(file);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const payload = {
      full_name: form.full_name.trim(),
      location: form.location.trim(),
      total_experience_years: form.total_experience_years,
      skills: form.skills,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      current_role: form.current_role.trim() || null,
      professional_summary: form.professional_summary.trim() || null,
    };

    try {
      const saved = isEdit
        ? await updateCandidate({ id: candidateId, body: payload }).unwrap()
        : await createCandidate(payload).unwrap();

      // The CV is a separate request. A failure here must not discard a
      // candidate that saved successfully, so it degrades to a warning on
      // the details page rather than rolling anything back.
      if (cvFile) {
        try {
          await uploadCv({ id: saved.id, file: cvFile }).unwrap();
        } catch (caught) {
          navigate(`/candidates/${saved.id}`, {
            state: { cvError: errorMessage(caught, "The CV could not be attached.") },
          });
          return;
        }
      }
      navigate(`/candidates/${saved.id}`);
    } catch (caught) {
      setFormError(errorMessage(caught, "Could not save this candidate."));
    }
  }

  if (tenantId == null) {
    return (
      <>
        <PageHeader title="Add Candidate" />
        <Card className="p-6 text-sm text-slate-600">Select a tenant first.</Card>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <PageHeader
        title={isEdit ? "Edit Candidate" : "Add Candidate"}
        description={
          isEdit
            ? "Update this candidate's profile."
            : "Upload a CV or type the details in manually — both work."
        }
      />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* CV control sits at the top, per the brief. */}
          <Card className="p-5">
            <Label>Upload CV <span className="font-normal text-slate-500">(optional)</span></Label>
            {cvFile ? (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-200">
                <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                  <Paperclip size={15} className="shrink-0 text-slate-400" />
                  <span className="truncate">{cvFile.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {(cvFile.size / 1024).toFixed(0)} KB
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => pickFile(null)}
                  aria-label="Remove selected file"
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-600 hover:border-brand-400 hover:bg-brand-50/40">
                <Upload size={18} className="text-slate-400" />
                <span>
                  <span className="font-medium text-brand-700">Choose a file</span> — PDF or
                  DOCX, up to {MAX_CV_MB} MB
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="sr-only"
                  onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
                />
              </label>
            )}
            <FieldError>{cvWarning}</FieldError>
            <p className="mt-2 text-xs text-slate-500">
              Automatic form filling from a CV is not enabled in this build — enter the details
              below. The file is stored and downloadable from the candidate's page.
            </p>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full_name" required>Full Name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  invalid={Boolean(fieldErrors.full_name)}
                  onChange={(event) => set("full_name", event.target.value)}
                />
                <FieldError>{fieldErrors.full_name}</FieldError>
              </div>
              <div>
                <Label htmlFor="location" required>Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  invalid={Boolean(fieldErrors.location)}
                  placeholder="e.g. Bengaluru"
                  onChange={(event) => set("location", event.target.value)}
                />
                <FieldError>{fieldErrors.location}</FieldError>
              </div>
              <div>
                <Label htmlFor="experience" required>Total Experience (Years)</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={form.total_experience_years}
                  invalid={Boolean(fieldErrors.total_experience_years)}
                  onChange={(event) => set("total_experience_years", event.target.value)}
                />
                <FieldError>{fieldErrors.total_experience_years}</FieldError>
              </div>
              <div>
                <Label htmlFor="current_role">Current Role</Label>
                <Input
                  id="current_role"
                  value={form.current_role}
                  placeholder="e.g. Senior Backend Engineer"
                  onChange={(event) => set("current_role", event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label required>Skills</Label>
              <SkillInput
                value={form.skills}
                onChange={(skills) => {
                  set("skills", skills);
                }}
                invalid={Boolean(fieldErrors.skills)}
              />
              <FieldError>{fieldErrors.skills}</FieldError>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Contact &amp; summary</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                rows={4}
                value={form.professional_summary}
                onChange={(event) => set("professional_summary", event.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="space-y-3 p-5 lg:sticky lg:top-20">
            <p className="text-sm text-slate-600">
              Fields marked <span className="text-rose-600">*</span> are required.
            </p>
            {formError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
            )}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create Candidate"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
          </Card>
        </div>
      </form>
    </>
  );
}
