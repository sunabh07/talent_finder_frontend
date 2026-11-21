/**
 * The list-page building blocks, shared by every module.
 *
 * The assignment's one reference wireframe fixes the anatomy of a list page:
 * header row, summary cards, toolbar, table with a row action menu, then a
 * footer with the result count and pagination. Building that once here is
 * what stops the four modules drifting into four different-looking screens.
 */

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Inbox, MoreVertical, Search, TriangleAlert } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";

// --- Summary cards -----------------------------------------------------------

export function SummaryCards({
  cards,
  loading,
}: {
  cards: { label: string; value: number | string }[];
  loading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {card.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-200" /> : card.value}
          </p>
        </Card>
      ))}
    </div>
  );
}

// --- Toolbar -----------------------------------------------------------------

export interface SortOption {
  value: string;
  label: string;
  dir?: "asc" | "desc";
}

export function Toolbar({
  search,
  onSearchChange,
  placeholder = "Search…",
  sortOptions,
  sortValue,
  onSortChange,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="block w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500"
        />
      </div>
      <div className="flex items-center gap-2">
        {children}
        {sortOptions && onSortChange && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">Sort by</span>
            <select
              value={sortValue}
              onChange={(event) => onSortChange(event.target.value)}
              aria-label="Sort by"
              className="rounded-lg border-0 bg-white py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

// --- Row action menu ---------------------------------------------------------

export interface RowAction {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}

export function ActionMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={clsx(
                "block w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                action.tone === "danger" ? "text-rose-600" : "text-slate-700",
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- States -------------------------------------------------------------------

export function LoadingRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-slate-100">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-4 py-4">
              <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Inbox size={28} className="text-slate-300" />
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <TriangleAlert size={28} className="text-amber-500" />
      <p className="text-sm font-medium text-slate-900">Could not load this list</p>
      <p className="max-w-md text-sm text-slate-500">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// --- Table shell ---------------------------------------------------------------

export function TableShell({
  headers,
  children,
}: {
  headers: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            {headers.map((header, index) => (
              <th key={index} scope="col" className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// --- Footer / pagination --------------------------------------------------------

export function TableFooter({
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium">{first}</span>–
        <span className="font-medium">{last}</span> of{" "}
        <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={15} /> Prev
        </Button>
        <span className="px-2 text-sm tabular-nums text-slate-600">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

// --- Skill chips -----------------------------------------------------------------

export function SkillChips({
  skills,
  max = 4,
}: {
  skills: { id: number; name: string }[];
  max?: number;
}) {
  const shown = skills.slice(0, max);
  const overflow = skills.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((skill) => (
        <span
          key={skill.id}
          className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
        >
          {skill.name}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          +{overflow}
        </span>
      )}
    </div>
  );
}
