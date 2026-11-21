/**
 * Story 3.2 Create Job Order, and the edit form.
 *
 * Note the absence of any upload control: the brief states explicitly that
 * "there is no file upload on this form - job orders are always created by
 * manual entry".
 */

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  errorMessage,
  useCreateJobOrderMutation,
  useGetJobOrderQuery,
  useUpdateJobOrderMutation,
} from "@/app/api";
import { useSelectedTenantId } from "@/app/hooks";
import { PageHeader } from "@/components/Layout";
import { SkillInput } from "@/components/SkillInput";
import { Button, Card, FieldError, Input, Label, Select, Textarea } from "@/components/ui";
import type { JobOrderStatus } from "@/types";

interface FormState {
  job_title: string;
  location: string;
  min_experience_years: string;
  number_of_openings: string;
  required_skills: string[];
  client_name: string;
  job_description: string;
  status: JobOrderStatus;
}

const EMPTY: FormState = {
  job_title: "",
  location: "",
  min_experience_years: "",
  number_of_openings: "1",
  required_skills: [],
  client_name: "",
  job_description: "",
  status: "Open",
};

export function JobOrderFormPage() {
  const { id } = useParams();
  const jobOrderId = id ? Number(id) : null;
  const isEdit = jobOrderId !== null;

  const navigate = useNavigate();
  const tenantId = useSelectedTenantId();

  const existing = useGetJobOrderQuery(jobOrderId as number, { skip: !isEdit });
  const [createJobOrder, createState] = useCreateJobOrderMutation();
  const [updateJobOrder, updateState] = useUpdateJobOrderMutation();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const job = existing.data;
    if (!job) return;
    setForm({
      job_title: job.job_title,
      location: job.location,
      min_experience_years: String(Number(job.min_experience_years)),
      number_of_openings: String(job.number_of_openings),
      required_skills: job.required_skills.map((skill) => skill.name),
      client_name: job.client_name ?? "",
      job_description: job.job_description ?? "",
      status: job.status,
    });
  }, [existing.data]);

  const saving = createState.isLoading || updateState.isLoading;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  /** Mirrors the server rules, for immediate feedback only. */
  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.job_title.trim()) errors.job_title = "Job title is required.";
    if (!form.location.trim()) errors.location = "Location is required.";

    const years = Number(form.min_experience_years);
    if (form.min_experience_years === "" || Number.isNaN(years)) {
      errors.min_experience_years = "Minimum experience is required.";
    } else if (years < 0 || years > 60) {
      errors.min_experience_years = "Enter a value between 0 and 60.";
    }

    const openings = Number(form.number_of_openings);
    if (!Number.isInteger(openings) || openings < 1) {
      errors.number_of_openings = "Enter a whole number of 1 or more.";
    }
    if (form.required_skills.length === 0) {
      errors.required_skills = "Add at least one required skill.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const payload = {
      job_title: form.job_title.trim(),
      location: form.location.trim(),
      min_experience_years: form.min_experience_years,
      number_of_openings: Number(form.number_of_openings),
      required_skills: form.required_skills,
      client_name: form.client_name.trim() || null,
      job_description: form.job_description.trim() || null,
      ...(isEdit ? { status: form.status } : {}),
    };

    try {
      const saved = isEdit
        ? await updateJobOrder({ id: jobOrderId, body: payload }).unwrap()
        : await createJobOrder(payload).unwrap();
      navigate(`/job-orders/${saved.id}`);
    } catch (caught) {
      setFormError(errorMessage(caught, "Could not save this job order."));
    }
  }

  if (tenantId == null) {
    return (
      <>
        <PageHeader title="Add Job Order" />
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
        title={isEdit ? "Edit Job Order" : "Add Job Order"}
        description={
          isEdit
            ? "Changing the required skills re-ranks the matching candidates."
            : "Required skills drive the candidate matching on the next screen."
        }
      />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="job_title" required>
                  Job Title
                </Label>
                <Input
                  id="job_title"
                  value={form.job_title}
                  invalid={Boolean(fieldErrors.job_title)}
                  placeholder="e.g. Senior Backend Engineer"
                  onChange={(event) => set("job_title", event.target.value)}
                />
                <FieldError>{fieldErrors.job_title}</FieldError>
              </div>
              <div>
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={form.client_name}
                  placeholder="Optional"
                  onChange={(event) => set("client_name", event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location" required>
                  Location
                </Label>
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
                <Label htmlFor="min_exp" required>
                  Min Experience (Years)
                </Label>
                <Input
                  id="min_exp"
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={form.min_experience_years}
                  invalid={Boolean(fieldErrors.min_experience_years)}
                  onChange={(event) => set("min_experience_years", event.target.value)}
                />
                <FieldError>{fieldErrors.min_experience_years}</FieldError>
              </div>
              <div>
                <Label htmlFor="openings" required>
                  Number of Openings
                </Label>
                <Input
                  id="openings"
                  type="number"
                  min={1}
                  step={1}
                  value={form.number_of_openings}
                  invalid={Boolean(fieldErrors.number_of_openings)}
                  onChange={(event) => set("number_of_openings", event.target.value)}
                />
                <FieldError>{fieldErrors.number_of_openings}</FieldError>
              </div>
              {isEdit && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={form.status}
                    onChange={(event) => set("status", event.target.value as JobOrderStatus)}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label required>Required Skills</Label>
              <SkillInput
                value={form.required_skills}
                onChange={(skills) => set("required_skills", skills)}
                invalid={Boolean(fieldErrors.required_skills)}
              />
              <FieldError>{fieldErrors.required_skills}</FieldError>
              <p className="mt-2 text-xs text-slate-500">
                Candidates are ranked by how many of these they match.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.job_description}
              onChange={(event) => set("job_description", event.target.value)}
            />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="space-y-3 p-5 lg:sticky lg:top-20">
            <p className="text-sm text-slate-600">
              Fields marked <span className="text-rose-600">*</span> are required.
            </p>
            {!isEdit && (
              <p className="text-xs text-slate-500">New job orders start with status Open.</p>
            )}
            {formError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
            )}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create Job Order"}
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
