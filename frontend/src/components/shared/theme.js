/**
 * Shared design tokens — used by Group 2 (dashboard) components.
 * Import this wherever you need consistent colours or font names.
 */

export const C = {
  ink: "#1C2B39",
  paper: "#EFEDE6",
  surface: "#FBFAF7",
  line: "#D8D3C7",
  muted: "#7C8A94",
  amber: "#C98A2C",
  critical: "#A63D40",
  teal: "#3E7C7C",
  sage: "#6B8F71",
};

export const COLORS = C;

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

export const FONT_IMPORT = FONTS;

export const DEPARTMENTS = [
  "Roads & Infrastructure",
  "Water Supply",
  "Sanitation & Waste",
  "Electricity",
  "Public Safety",
  "Parks & Environment",
];

export const PRIORITIES = ["Critical", "High", "Medium", "Low"];
export const STATUSES = ["Open", "In Progress", "Resolved"];

export function priorityColor(p) {
  if (p === "Critical") return C.critical;
  if (p === "High") return C.amber;
  if (p === "Medium") return C.teal;
  return C.muted;
}

export function statusColor(s) {
  if (s === "Open") return C.amber;
  if (s === "In Progress") return C.teal;
  return C.sage;
}
