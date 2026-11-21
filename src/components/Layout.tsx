/**
 * The application shell: fixed left sidebar, top header, page outlet.
 *
 * The brief mandates this layout exactly - sidebar links for Tenant,
 * Candidate, Job Order and Submission; logo on the left of the header, bell
 * and avatar on the right. Everything inside the outlet is free-form.
 *
 * On mobile the sidebar collapses behind a menu button rather than
 * disappearing, so all four modules stay reachable at phone width.
 */

import clsx from "clsx";
import {
  Bell,
  Briefcase,
  Building2,
  Menu,
  Send,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { TenantSwitcher } from "@/components/TenantSwitcher";

const NAV_ITEMS = [
  { to: "/tenants", label: "Tenant", icon: Building2 },
  { to: "/candidates", label: "Candidate", icon: Users },
  { to: "/job-orders", label: "Job Order", icon: Briefcase },
  { to: "/submissions", label: "Submission", icon: Send },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        TF
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-slate-900">
        Talent Finder
      </span>
    </div>
  );
}

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <Logo />
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Notifications"
              title="Notifications (demo only)"
              className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
            </button>
            {/* Visual only - this build has no authentication by design. */}
            <div
              title="Demo user - this build has no authentication"
              className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600"
            >
              RC
            </div>
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-16 z-20 hidden h-[calc(100vh-4rem)] w-56 border-r border-slate-200 bg-white lg:block">
        <NavItems />
      </aside>

      {/* Mobile sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <Logo />
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <main className="px-4 pb-12 pt-20 lg:pl-60 lg:pr-6">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/**
 * Page header row: title on the left, tenant dropdown and primary action on
 * the right - the arrangement the reference wireframe specifies.
 */
export function PageHeader({
  title,
  description,
  showTenant = true,
  action,
}: {
  title: string;
  description?: string;
  showTenant?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showTenant && <TenantSwitcher />}
        {action}
      </div>
    </div>
  );
}
