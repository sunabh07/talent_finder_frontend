/**
 * Shared list-screen state: search, sort and pagination.
 *
 * Every list page needs the same three things behaving the same way, so the
 * rules live here once:
 *
 * - The search box is **debounced** (300 ms). Without it, every keystroke is
 *   a request, and fast typing can let an earlier response land after a later
 *   one and paint stale rows.
 * - Changing the search term or the sort **resets to page 1**. Staying on
 *   page 4 of a result set that now has one page shows an empty table and
 *   looks like a bug.
 * - Sort is a single `field:dir` string, because that is what a `<select>`
 *   can hold, and it is split only when the request is built.
 */

import { useEffect, useMemo, useState } from "react";
import type { ListParams } from "@/types";

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;

export function useListControls(defaultSort: string) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort]);

  const params: ListParams = useMemo(() => {
    const [sortBy, sortDir] = sort.split(":");
    return {
      q: debouncedSearch.trim() || undefined,
      sort_by: sortBy,
      sort_dir: (sortDir as "asc" | "desc") ?? "asc",
      page,
      page_size: PAGE_SIZE,
    };
  }, [debouncedSearch, sort, page]);

  return {
    search,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
    params,
    /** True while the user has typed but the debounced request has not caught up. */
    isTyping: search !== debouncedSearch,
  };
}
