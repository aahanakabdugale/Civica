/**
 * ComplaintDetail.jsx — pages/
 * Full-detail view for a single complaint, opened from DashboardHome
 * when a table row is clicked. Renders as a slide-in drawer overlay.
 *
 * Props:
 *   complaint      Complaint | null  — the selected complaint object
 *   onClose        () => void        — dismiss the detail view
 *   onStatusChange (id, status) => void  — propagates status update upward
 */

import { X, MapPin, Copy, AlertTriangle } from "lucide-react";
import PriorityBadge from "../components/dashboard/PriorityBadge";
import StatusUpdateButton from "../components/dashboard/StatusUpdateButton";
import { C, FONTS } from "../components/shared/theme";

export default function ComplaintDetail({ complaint, onClose, onStatusChange }) {
  if (!complaint) return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true" aria-label="Complaint detail">
      <div
        id="detail-backdrop"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(28,43,57,0.35)" }}
      />

      {/* Drawer panel */}
      <div
        style={{
          background: C.surface,
          borderLeft: `1px solid ${C.line}`,
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
        className="relative w-full max-w-md h-full overflow-y-auto p-6"
      >
        <style>{FONTS}</style>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted }}
              className="text-xs"
            >
              {complaint.id}
            </span>
            <h2
              style={{ fontFamily: "'Fraunces', serif", color: C.ink }}
              className="text-2xl mt-1"
            >
              {complaint.dept}
            </h2>
          </div>
          <button
            id="detail-close-btn"
            onClick={onClose}
            style={{ color: C.muted }}
            aria-label="Close detail panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Duplicate warning */}
        {complaint.dup && (
          <div
            style={{
              border: `1px solid ${C.amber}`,
              background: `${C.amber}12`,
              borderRadius: 3,
              color: C.ink,
            }}
            className="flex items-center gap-2 text-sm px-3 py-2 mb-5"
          >
            <Copy size={14} color={C.amber} aria-hidden="true" />
            Flagged as a likely duplicate of{" "}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{complaint.dup}</span>
          </div>
        )}

        {/* Complaint text */}
        <p style={{ color: C.ink }} className="text-base leading-relaxed mb-5">
          {complaint.text}
        </p>

        {/* Location & time */}
        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: C.muted }}>
          <MapPin size={14} aria-hidden="true" />
          {complaint.location}
        </div>
        <div style={{ color: C.muted }} className="text-sm mb-6">
          Submitted {complaint.submitted}
        </div>

        {/* Priority */}
        <div className="flex items-center gap-3 mb-6">
          <PriorityBadge priority={complaint.priority} />
          <span style={{ color: C.ink }} className="text-sm font-medium">priority</span>
        </div>

        {/* Status stepper */}
        <div style={{ borderTop: `1px solid ${C.line}` }} className="pt-5">
          <StatusUpdateButton
            complaintId={complaint.id}
            currentStatus={complaint.status}
            onStatusChange={onStatusChange}
          />
        </div>

        {/* Critical alert callout */}
        {complaint.priority === "Critical" && complaint.status === "Open" && (
          <div
            style={{
              marginTop: 24,
              border: `1px solid ${C.critical}`,
              background: `${C.critical}0d`,
              borderRadius: 3,
              color: C.critical,
            }}
            className="flex items-start gap-2 text-sm px-3 py-2"
          >
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>
              This is a <strong>Critical</strong> complaint that is still open. Please escalate or assign immediately.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
