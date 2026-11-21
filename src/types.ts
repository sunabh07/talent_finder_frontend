/** Mirrors the backend response schemas in docs/api-contract.md. */

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  error: { code: string; message: string; details: Record<string, unknown> };
}

export interface Tenant {
  id: number;
  name: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

export interface TenantStats {
  total: number;
  active: number;
  added_this_week: number;
}

export interface Skill {
  id: number;
  name: string;
}

export interface CandidateListItem {
  id: number;
  full_name: string;
  location: string;
  total_experience_years: string;
  current_role: string | null;
  skills: Skill[];
  has_cv: boolean;
  created_at: string;
}

export interface CandidateSubmissionLink {
  submission_id: number;
  job_order_id: number;
  job_title: string;
  client_name: string | null;
  status: string;
  created_at: string;
}

export interface Candidate {
  id: number;
  full_name: string;
  location: string;
  total_experience_years: string;
  email: string | null;
  phone: string | null;
  current_role: string | null;
  professional_summary: string | null;
  skills: Skill[];
  has_cv: boolean;
  cv_filename: string | null;
  cv_mime_type: string | null;
  cv_size_bytes: number | null;
  submissions: CandidateSubmissionLink[];
  created_at: string;
  updated_at: string;
}

export interface CandidateStats {
  total: number;
  added_this_week: number;
  with_cv: number;
}

export interface CandidateInput {
  full_name: string;
  location: string;
  total_experience_years: string;
  skills: string[];
  email?: string | null;
  phone?: string | null;
  current_role?: string | null;
  professional_summary?: string | null;
}

/** Query parameters every list endpoint accepts. */
export interface ListParams {
  q?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

// --- Job orders (Story 3) ---------------------------------------------------

export type JobOrderStatus = "Open" | "Closed";

export interface JobOrderListItem {
  id: number;
  job_title: string;
  client_name: string | null;
  location: string;
  min_experience_years: string;
  number_of_openings: number;
  required_skills: Skill[];
  status: JobOrderStatus;
  created_at: string;
}

export interface ShortlistedCandidate {
  submission_id: number;
  candidate_id: number;
  full_name: string;
  current_role: string | null;
  location: string;
  total_experience_years: string;
  status: string;
  created_at: string;
}

export interface JobOrder {
  id: number;
  job_title: string;
  client_name: string | null;
  location: string;
  min_experience_years: string;
  number_of_openings: number;
  required_skills: Skill[];
  status: JobOrderStatus;
  job_description: string | null;
  shortlisted: ShortlistedCandidate[];
  created_at: string;
  updated_at: string;
}

export interface JobOrderStats {
  total: number;
  open: number;
  total_openings: number;
}

export interface JobOrderInput {
  job_title: string;
  location: string;
  min_experience_years: string;
  number_of_openings: number;
  required_skills: string[];
  client_name?: string | null;
  job_description?: string | null;
  status?: JobOrderStatus;
}

// --- Matching (Story 3.3) ----------------------------------------------------

export interface MatchedCandidate {
  candidate_id: number;
  full_name: string;
  current_role: string | null;
  location: string;
  total_experience_years: string;
  matched_skills: string[];
  match_count: number;
  meets_min_experience: boolean;
  is_shortlisted: boolean;
}

export interface MatchSummary {
  job_order_id: number;
  required_skill_count: number;
  required_skills: Skill[];
}

/** The standard Page envelope plus the job's required-skill context. */
export interface MatchPage {
  items: MatchedCandidate[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: MatchSummary;
}

// --- Submissions (Story 4) ---------------------------------------------------

export interface SubmissionListItem {
  id: number;
  job_order_id: number;
  job_title: string;
  client_name: string | null;
  candidate_id: number;
  candidate_name: string;
  status: string;
  created_at: string;
}

export interface SubmissionStats {
  total: number;
  added_this_week: number;
  job_orders_with_submissions: number;
}

export interface ShortlistResult {
  submission_id: number;
  job_order_id: number;
  candidate_id: number;
  status: string;
  created_at: string;
  already_shortlisted: boolean;
}
