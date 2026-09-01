/**
 * PriorityBadge.jsx — components/dashboard/
 * Small coloured dot + label showing a complaint's priority level.
 * Imported by ComplaintTable and ComplaintDetail.
 *
 * Props:
 *   priority  "Critical" | "High" | "Medium" | "Low"
 *   showLabel boolean (default true) — set false to render dot only
 */

import { C, priorityColor } from "../shared/theme";

function Dot({ color }) {
  return (
    <span
      style={{ background: color, flexShrink: 0 }}
      className="inline-block w-2 h-2 rounded-full"
    />
  );
}

export default function PriorityBadge({ priority, showLabel = true }) {
  const color = priorityColor(priority);
  return (
    <span className="inline-flex items-center gap-2">
      <Dot color={color} />
      {showLabel && (
        <span style={{ color: C.ink, fontFamily: "'IBM Plex Sans', sans-serif" }} className="text-sm">
          {priority}
        </span>
      )}
    </span>
  );
}
