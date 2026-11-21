import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/app/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** The tenant currently selected, or null when none has been chosen yet. */
export const useSelectedTenantId = (): number | null =>
  useAppSelector((state) => state.tenant.selectedTenantId);
