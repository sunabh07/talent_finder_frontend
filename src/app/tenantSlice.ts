/**
 * Which tenant the recruiter is currently working in.
 *
 * Persisted to localStorage so a page refresh does not dump the user back to
 * "no tenant selected" mid-task. The value is only ever a hint: every request
 * still carries it to the backend, which validates it independently.
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "talentfinder.selectedTenantId";

function readStored(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw == null ? NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    // Private mode or blocked storage - a missing preference is harmless.
    return null;
  }
}

interface TenantState {
  selectedTenantId: number | null;
}

const initialState: TenantState = { selectedTenantId: readStored() };

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    selectTenant(state, action: PayloadAction<number | null>) {
      state.selectedTenantId = action.payload;
      try {
        if (action.payload == null) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, String(action.payload));
      } catch {
        /* storage unavailable; selection still works for this session */
      }
    },
  },
});

export const { selectTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
