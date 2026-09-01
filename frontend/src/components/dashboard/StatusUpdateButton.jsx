/**
 * StatusUpdateButton.jsx — components/dashboard/
 * Three-step stepper (Open → In Progress → Resolved) that lets authority
 * staff move a complaint through its lifecycle.
 *
 * Props:
 *   complaintId  string
 *   currentStatus "Open" | "In Progress" | "Resolved"
 *   onStatusChange (complaintId, newStatus) => void
 */

import { C, FONTS, STATUSES, statusColor } from "../shared/theme";

export default function StatusUpdateButton({ complaintId, currentStatus, onStatusChange }) {
  const currentIdx = STATUSES.indexOf(currentStatus);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{FONTS}</style>
      <p style={{ color: C.ink }} className="text-sm font-medium mb-3">Update status</p>

      <div className="flex items-center">
        {STATUSES.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              id={`status-step-${s.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => onStatusChange && onStatusChange(complaintId, s)}
              className="flex flex-col items-center gap-2 flex-1"
              aria-label={`Set status to ${s}`}
              aria-pressed={i === currentIdx}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: i <= currentIdx ? statusColor(s) : "transparent",
                  border: `2px solid ${i <= currentIdx ? statusColor(s) : C.line}`,
                  transition: "all 0.2s",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  color: i === currentIdx ? C.ink : C.muted,
                  fontWeight: i === currentIdx ? 600 : 400,
                }}
                className="text-xs"
              >
                {s}
              </span>
            </button>

            {i < STATUSES.length - 1 && (
              <div
                style={{
                  height: 2,
                  background: i < currentIdx ? statusColor(STATUSES[i + 1]) : C.line,
                  transition: "background 0.2s",
                }}
                className="flex-1 -mt-5"
              />
            )}
          </div>
        ))}
      </div>

      <p style={{ color: C.muted }} className="text-xs mt-5">
        Selecting a stage updates this complaint immediately and is visible to
        the citizen on their tracking page.
      </p>
    </div>
  );
}
