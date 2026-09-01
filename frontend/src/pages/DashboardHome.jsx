/**
 * DashboardHome.jsx — pages/
 * Main authority dashboard: sidebar + filter bar + complaint table.
 * Clicking a row opens ComplaintDetail as an overlay drawer.
 *
 * Props:
 *   onLogout  () => void  — propagated to Navbar
 */

import { useState } from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import Navbar from "../components/shared/Navbar";
import FilterBar from "../components/shared/FilterBar";
import ComplaintTable from "../components/dashboard/ComplaintTable";
import ComplaintDetail from "./ComplaintDetail";
import { useComplaints } from "../hooks/useComplaints";
import { C, FONTS, DEPARTMENTS } from "../components/shared/theme";

export default function DashboardHome({ onLogout }) {
  const {
    filtered,
    deptCounts,
    stats,
    dept, setDept,
    priority, setPriority,
    status, setStatus,
    search, setSearch,
    updateStatus,
    getById,
  } = useComplaints();

  const [selectedId, setSelectedId] = useState(null);
  const selectedComplaint = getById(selectedId);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: C.paper, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{FONTS}</style>

      {/* ── Sidebar ── */}
      <aside
        style={{ borderRight: `1px solid ${C.line}`, background: C.surface }}
        className="w-60 flex-shrink-0 hidden md:flex flex-col p-5"
        aria-label="Department filter sidebar"
      >
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck size={18} color={C.ink} />
          <span style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-lg">
            Nagrik Ops
          </span>
        </div>

        {/* Department nav */}
        <p style={{ color: C.muted }} className="text-xs mb-3 uppercase tracking-wide">
          Departments
        </p>
        <nav className="flex flex-col gap-1" aria-label="Filter by department">
          <button
            id="sidebar-dept-all"
            onClick={() => setDept("All")}
            style={{
              color: dept === "All" ? C.ink : C.muted,
              fontWeight: dept === "All" ? 600 : 400,
            }}
            className="flex items-center justify-between text-sm py-1.5 text-left"
          >
            All complaints
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
              {stats.total}
            </span>
          </button>

          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              id={`sidebar-dept-${d.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
              onClick={() => setDept(d)}
              style={{
                color: dept === d ? C.ink : C.muted,
                fontWeight: dept === d ? 600 : 400,
              }}
              className="flex items-center justify-between text-sm py-1.5 text-left"
            >
              <span className="truncate pr-2">{d}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs flex-shrink-0">
                {deptCounts[d] || 0}
              </span>
            </button>
          ))}
        </nav>

        {/* Logout (sidebar) */}
        <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-auto pt-4">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            style={{ color: C.muted }}
            className="flex items-center gap-2 text-sm"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top stat strip / navbar */}
        <Navbar
          onLogout={onLogout}
          openCount={stats.open}
          criticalCount={stats.critical}
          dupCount={stats.duplicates}
        />

        {/* Filters */}
        <FilterBar
          search={search}
          priority={priority}
          status={status}
          dept={dept}
          onSearch={setSearch}
          onPriority={setPriority}
          onStatus={setStatus}
          onDept={setDept}
        />

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
          <ComplaintTable
            complaints={filtered}
            onSelect={(id) => setSelectedId(id)}
          />
        </div>
      </div>

      {/* ── Detail drawer ── */}
      {selectedComplaint && (
        <ComplaintDetail
          complaint={selectedComplaint}
          onClose={() => setSelectedId(null)}
          onStatusChange={(id, newStatus) => {
            updateStatus(id, newStatus);
          }}
        />
      )}
    </div>
  );
}
