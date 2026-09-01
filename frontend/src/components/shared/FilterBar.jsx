/**
 * FilterBar.jsx — components/shared/
 * Search + priority + status filter controls used in DashboardHome.
 *
 * Props:
 *   search       string        — current search text
 *   priority     string        — active priority filter ("All" | "Critical" | "High" | "Medium" | "Low")
 *   status       string        — active status filter ("All" | "Open" | "In Progress" | "Resolved")
 *   dept         string        — active dept filter (mobile select only)
 *   departments  string[]      — list of all department names
 *   onSearch     (val) => void
 *   onPriority   (val) => void
 *   onStatus     (val) => void
 *   onDept       (val) => void  — mobile dept select change
 */

import { Search } from "lucide-react";
import { C, FONTS, PRIORITIES, STATUSES, DEPARTMENTS, priorityColor, statusColor } from "./theme";

function Pill({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        border: `1px solid ${active ? (color || C.ink) : C.line}`,
        borderRadius: 3,
        color: active ? (color || C.ink) : C.muted,
        background: active ? `${(color || C.ink)}14` : "transparent",
        fontWeight: active ? 600 : 400,
        transition: "all 0.15s",
      }}
      className="px-3 py-1 text-sm"
    >
      {children}
    </button>
  );
}

export default function FilterBar({
  search = "",
  priority = "All",
  status = "All",
  dept = "All",
  departments = DEPARTMENTS,
  onSearch,
  onPriority,
  onStatus,
  onDept,
}) {
  return (
    <div
      style={{ borderBottom: `1px solid ${C.line}`, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="px-6 py-4 flex flex-wrap items-center gap-3"
    >
      <style>{FONTS}</style>

      {/* Search */}
      <div
        id="filter-search"
        style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: C.surface }}
        className="flex items-center gap-2 px-3 py-1.5"
      >
        <Search size={14} color={C.muted} />
        <input
          value={search}
          onChange={(e) => onSearch && onSearch(e.target.value)}
          placeholder="Search complaints…"
          style={{ color: C.ink }}
          className="text-sm outline-none bg-transparent w-40"
          aria-label="Search complaints"
        />
      </div>

      {/* Department — mobile only select */}
      <select
        id="filter-dept-mobile"
        value={dept}
        onChange={(e) => onDept && onDept(e.target.value)}
        style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: C.surface, color: C.ink }}
        className="text-sm px-2 py-1.5 md:hidden"
        aria-label="Filter by department"
      >
        <option value="All">All departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Priority pills */}
      <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by priority">
        <Pill active={priority === "All"} onClick={() => onPriority && onPriority("All")}>All priority</Pill>
        {PRIORITIES.map((p) => (
          <Pill key={p} active={priority === p} onClick={() => onPriority && onPriority(p)} color={priorityColor(p)}>
            {p}
          </Pill>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
        <Pill active={status === "All"} onClick={() => onStatus && onStatus("All")}>All status</Pill>
        {STATUSES.map((s) => (
          <Pill key={s} active={status === s} onClick={() => onStatus && onStatus(s)} color={statusColor(s)}>
            {s}
          </Pill>
        ))}
      </div>
    </div>
  );
}
