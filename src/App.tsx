import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CandidateDetailPage } from "@/features/candidates/CandidateDetailPage";
import { CandidateFormPage } from "@/features/candidates/CandidateFormPage";
import { CandidateListPage } from "@/features/candidates/CandidateListPage";
import { JobOrderDetailPage } from "@/features/jobOrders/JobOrderDetailPage";
import { JobOrderFormPage } from "@/features/jobOrders/JobOrderFormPage";
import { JobOrderListPage } from "@/features/jobOrders/JobOrderListPage";
import { SubmissionListPage } from "@/features/submissions/SubmissionListPage";
import { TenantListPage } from "@/features/tenants/TenantListPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/tenants" replace />} />
        <Route path="tenants" element={<TenantListPage />} />

        <Route path="candidates" element={<CandidateListPage />} />
        <Route path="candidates/new" element={<CandidateFormPage />} />
        <Route path="candidates/:id" element={<CandidateDetailPage />} />
        <Route path="candidates/:id/edit" element={<CandidateFormPage />} />

        <Route path="job-orders" element={<JobOrderListPage />} />
        <Route path="job-orders/new" element={<JobOrderFormPage />} />
        <Route path="job-orders/:id" element={<JobOrderDetailPage />} />
        <Route path="job-orders/:id/edit" element={<JobOrderFormPage />} />

        <Route path="submissions" element={<SubmissionListPage />} />

        <Route path="*" element={<Navigate to="/tenants" replace />} />
      </Route>
    </Routes>
  );
}
