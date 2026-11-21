/**
 * The single API client.
 *
 * Two things are centralised here on purpose:
 *
 * 1. **The tenant header.** `prepareHeaders` reads the selected tenant from
 *    Redux and attaches `X-Tenant-ID` to every request. No page or component
 *    ever passes a tenant id by hand, which mirrors the backend's single
 *    `get_tenant_scope` dependency: one place to get right on each side.
 *
 * 2. **Cache invalidation.** Tenant-owned data is tagged, and switching
 *    tenants resets the whole cache (see `tenantSlice`). That is what makes
 *    "never show stale previous-tenant rows" a property of the data layer
 *    rather than a refetch call every screen has to remember.
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiError,
  Candidate,
  CandidateInput,
  CandidateListItem,
  CandidateStats,
  JobOrder,
  JobOrderInput,
  JobOrderListItem,
  JobOrderStats,
  ListParams,
  MatchPage,
  Page,
  ShortlistResult,
  Skill,
  SubmissionListItem,
  SubmissionStats,
  Tenant,
  TenantStats,
} from "@/types";
import type { RootState } from "@/app/store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

/** Pull a readable message out of the backend's error envelope. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  const data = (error as { data?: ApiError } | undefined)?.data;
  if (data?.error?.message) {
    const fields = data.error.details?.fields as
      | { field: string; message: string }[]
      | undefined;
    if (fields?.length) {
      return fields.map((f) => `${f.field}: ${f.message}`).join(" · ");
    }
    return data.error.message;
  }
  if ((error as { status?: unknown })?.status === "FETCH_ERROR") {
    return "Cannot reach the API. Is the backend running?";
  }
  return fallback;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const tenantId = (getState() as RootState).tenant.selectedTenantId;
      if (tenantId != null) headers.set("X-Tenant-ID", String(tenantId));
      return headers;
    },
  }),
  tagTypes: ["Tenant", "Candidate", "JobOrder", "Submission", "Skill"],
  endpoints: (build) => ({
    // --- Tenants ---------------------------------------------------------
    listTenants: build.query<Page<Tenant>, ListParams>({
      query: (params) => ({ url: "/tenants", params }),
      providesTags: ["Tenant"],
    }),
    tenantStats: build.query<TenantStats, void>({
      query: () => "/tenants/stats",
      providesTags: ["Tenant"],
    }),
    createTenant: build.mutation<Tenant, { name: string }>({
      query: (body) => ({ url: "/tenants", method: "POST", body }),
      invalidatesTags: ["Tenant"],
    }),

    // --- Skills ----------------------------------------------------------
    listSkills: build.query<Page<Skill>, ListParams>({
      query: (params) => ({ url: "/skills", params }),
      providesTags: ["Skill"],
    }),

    // --- Candidates ------------------------------------------------------
    listCandidates: build.query<Page<CandidateListItem>, ListParams>({
      query: (params) => ({ url: "/candidates", params }),
      providesTags: ["Candidate"],
    }),
    candidateStats: build.query<CandidateStats, void>({
      query: () => "/candidates/stats",
      providesTags: ["Candidate"],
    }),
    getCandidate: build.query<Candidate, number>({
      query: (id) => `/candidates/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Candidate", id }, "Candidate"],
    }),
    createCandidate: build.mutation<Candidate, CandidateInput>({
      query: (body) => ({ url: "/candidates", method: "POST", body }),
      invalidatesTags: ["Candidate"],
    }),
    updateCandidate: build.mutation<Candidate, { id: number; body: Partial<CandidateInput> }>({
      query: ({ id, body }) => ({ url: `/candidates/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Candidate"],
    }),
    deleteCandidate: build.mutation<void, number>({
      query: (id) => ({ url: `/candidates/${id}`, method: "DELETE" }),
      invalidatesTags: ["Candidate"],
    }),
    uploadCv: build.mutation<unknown, { id: number; file: File }>({
      query: ({ id, file }) => {
        const form = new FormData();
        form.append("file", file);
        // No Content-Type header: the browser must set the multipart boundary.
        return { url: `/candidates/${id}/cv`, method: "POST", body: form };
      },
      invalidatesTags: ["Candidate"],
    }),
    deleteCv: build.mutation<void, number>({
      query: (id) => ({ url: `/candidates/${id}/cv`, method: "DELETE" }),
      invalidatesTags: ["Candidate"],
    }),

    // --- Job orders ------------------------------------------------------
    listJobOrders: build.query<Page<JobOrderListItem>, ListParams>({
      query: (params) => ({ url: "/job-orders", params }),
      providesTags: ["JobOrder"],
    }),
    jobOrderStats: build.query<JobOrderStats, void>({
      query: () => "/job-orders/stats",
      providesTags: ["JobOrder"],
    }),
    getJobOrder: build.query<JobOrder, number>({
      query: (id) => `/job-orders/${id}`,
      providesTags: ["JobOrder"],
    }),
    createJobOrder: build.mutation<JobOrder, JobOrderInput>({
      query: (body) => ({ url: "/job-orders", method: "POST", body }),
      invalidatesTags: ["JobOrder"],
    }),
    updateJobOrder: build.mutation<JobOrder, { id: number; body: Partial<JobOrderInput> }>({
      query: ({ id, body }) => ({ url: `/job-orders/${id}`, method: "PATCH", body }),
      // Editing required skills changes who matches, so matches must refetch.
      invalidatesTags: ["JobOrder"],
    }),
    deleteJobOrder: build.mutation<void, number>({
      query: (id) => ({ url: `/job-orders/${id}`, method: "DELETE" }),
      // Deleting a job cascades to its submissions, which the Submission List
      // and every affected candidate's detail page both display.
      invalidatesTags: ["JobOrder", "Submission", "Candidate"],
    }),

    // --- Matching --------------------------------------------------------
    jobOrderMatches: build.query<MatchPage, { id: number; params: ListParams }>({
      query: ({ id, params }) => ({ url: `/job-orders/${id}/matches`, params }),
      // Tagged JobOrder so that shortlisting - which flips is_shortlisted on a
      // match row - refetches this list without any manual wiring.
      providesTags: ["JobOrder"],
    }),

    // --- Shortlisting and submissions ------------------------------------
    shortlist: build.mutation<ShortlistResult, { jobOrderId: number; candidateId: number }>({
      query: ({ jobOrderId, candidateId }) => ({
        url: `/job-orders/${jobOrderId}/shortlist`,
        method: "POST",
        body: { candidate_id: candidateId },
      }),
      // One click changes three screens: the match row's button, the job's
      // Shortlisted Candidates section, and the Submission List - plus the
      // candidate's own detail page. Invalidating all three tags is what makes
      // that happen without any screen knowing about the others.
      invalidatesTags: ["JobOrder", "Submission", "Candidate"],
    }),
    listSubmissions: build.query<Page<SubmissionListItem>, ListParams>({
      query: (params) => ({ url: "/submissions", params }),
      providesTags: ["Submission"],
    }),
    submissionStats: build.query<SubmissionStats, void>({
      query: () => "/submissions/stats",
      providesTags: ["Submission"],
    }),
  }),
});

export const {
  useListTenantsQuery,
  useTenantStatsQuery,
  useCreateTenantMutation,
  useListSkillsQuery,
  useListCandidatesQuery,
  useCandidateStatsQuery,
  useGetCandidateQuery,
  useCreateCandidateMutation,
  useUpdateCandidateMutation,
  useDeleteCandidateMutation,
  useUploadCvMutation,
  useDeleteCvMutation,
  useListJobOrdersQuery,
  useJobOrderStatsQuery,
  useGetJobOrderQuery,
  useCreateJobOrderMutation,
  useUpdateJobOrderMutation,
  useDeleteJobOrderMutation,
  useJobOrderMatchesQuery,
  useShortlistMutation,
  useListSubmissionsQuery,
  useSubmissionStatsQuery,
} = api;

export const apiBaseUrl = BASE_URL;

/**
 * Download a CV to the user's disk.
 *
 * Deliberately not an `<a href>`: the endpoint is tenant-scoped, and a plain
 * link cannot carry the `X-Tenant-ID` header. So we fetch the bytes with the
 * header attached, then hand the browser a blob URL to save.
 */
export async function downloadCv(
  candidateId: number,
  tenantId: number,
  filename: string,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/candidates/${candidateId}/cv`, {
    headers: { "X-Tenant-ID": String(tenantId) },
  });
  if (!response.ok) {
    throw new Error("Could not download the CV.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
