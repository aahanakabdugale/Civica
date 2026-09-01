/**
 * ComplaintTable.jsx — components/dashboard/
 * Sortable, filterable table of complaints.
 * Receives already-filtered data from DashboardHome; handles only rendering.
 *
 * Props:
 *   complaints   Complaint[]    — filtered list to render
 *   onSelect     (id) => void   — called when a row is clicked
 */

import { Copy } from "lucide-react";
import PriorityBadge from "./PriorityBadge";
import { EmptyState } from "../shared/StateComponents";
import { C, FONTS, statusColor } from "../shared/theme";

function Dot({ color }) {
  return (
    <span
      style={{ background: color, flexShrink: 0 }}
      className="inline-block w-2 h-2 rounded-full"
    />
  );
}

export default function ComplaintTable({ complaints = [], onSelect }) {
  if (complaints.length === 0) {
    return (
      <EmptyState message="No complaints match these filters. Adjust department, priority or status to see more." />
    );
  }

  return (
    <div className="overflow-auto" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{FONTS}</style>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.line}`, color: C.muted }}>
            <th className="text-left font-normal pb-2 pr-4">ID</th>
            <th className="text-left font-normal pb-2 pr-4">Complaint</th>
            <th className="text-left font-normal pb-2 pr-4 hidden lg:table-cell">Department</th>
            <th className="text-left font-normal pb-2 pr-4">Priority</th>
            <th className="text-left font-normal pb-2 pr-4">Status</th>
            <th className="text-left font-normal pb-2 pr-4 hidden xl:table-cell">Location</th>
            <th className="text-left font-normal pb-2">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr
              key={c.id}
              id={`complaint-row-${c.id}`}
              onClick={() => onSelect && onSelect(c.id)}
              style={{ borderBottom: `1px solid ${C.line}` }}
              className="cursor-pointer transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* ID */}
              <td
                className="py-3 pr-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted }}
              >
                {c.id}
              </td>

              {/* Complaint text */}
              <td className="py-3 pr-4 max-w-xs" style={{ color: C.ink }}>
                <div className="flex items-center gap-2">
                  <span className="truncate">{c.text}</span>
                  {c.dup && <Copy size={12} color={C.amber} className="flex-shrink-0" aria-label="Possible duplicate" />}
                </div>
              </td>

              {/* Department */}
              <td className="py-3 pr-4 hidden lg:table-cell" style={{ color: C.ink }}>
                {c.dept}
              </td>

              {/* Priority */}
              <td className="py-3 pr-4">
                <PriorityBadge priority={c.priority} />
              </td>

              {/* Status */}
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <Dot color={statusColor(c.status)} />
                  <span style={{ color: C.ink }}>{c.status}</span>
                </div>
              </td>

              {/* Location */}
              <td className="py-3 pr-4 hidden xl:table-cell" style={{ color: C.muted }}>
                {c.location}
              </td>

              {/* Submitted */}
              <td className="py-3" style={{ color: C.muted }}>
                {c.submitted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
