/**
 * useComplaints.js — hooks/
 * Manages the complaint list state for the Authority Dashboard.
 *
 * In production, replace MOCK_COMPLAINTS with real API calls (api.js).
 * The hook exposes complaints, filter state, derived values, and actions
 * so pages stay thin and business logic is testable in isolation.
 */

import { useState, useMemo } from "react";

/* ------------------------------------------------------------------
   Mock data (mirrors what AuthorityDashboard.jsx had, keep in sync
   with api.js once the backend is wired up)
------------------------------------------------------------------ */
const RAW = [
  ["NGK-3001", "Live wire hanging near bus stop on MG Road, sparking during rain", "Electricity", "Critical", "Open", "MG Road, Ward 7", "42 min ago", null],
  ["NGK-3002", "Large pothole on service lane causing two-wheeler accidents", "Roads & Infrastructure", "High", "In Progress", "Service Lane, Sector 12", "1 hr ago", null],
  ["NGK-3003", "Overflowing garbage bin uncollected for 5 days near market", "Sanitation & Waste", "Medium", "Open", "Gandhi Market", "2 hr ago", null],
  ["NGK-3004", "Pothole near Sector 12 service lane, cars swerving into traffic", "Roads & Infrastructure", "High", "Open", "Service Lane, Sector 12", "2 hr ago", "NGK-3002"],
  ["NGK-3005", "No water supply in Shanti Nagar for third consecutive day", "Water Supply", "High", "Open", "Shanti Nagar", "3 hr ago", null],
  ["NGK-3006", "Streetlight not working on park perimeter, unsafe at night", "Public Safety", "Medium", "In Progress", "Nehru Park", "4 hr ago", null],
  ["NGK-3007", "Sewage leak flooding footpath outside school gate", "Sanitation & Waste", "Critical", "Open", "St. Xavier's Gate", "5 hr ago", null],
  ["NGK-3008", "Broken swing and rusted see-saw in children's play area", "Parks & Environment", "Low", "Open", "Lake Garden", "6 hr ago", null],
  ["NGK-3009", "Transformer humming loudly, residents worried about fire", "Electricity", "High", "Open", "Ward 9 Colony", "7 hr ago", null],
  ["NGK-3010", "Water tanker hasn't arrived despite scheduled slot", "Water Supply", "Medium", "Resolved", "Shanti Nagar", "9 hr ago", "NGK-3005"],
  ["NGK-3011", "Illegal dumping of construction debris on empty plot", "Sanitation & Waste", "Medium", "Open", "Plot 44, Sector 3", "11 hr ago", null],
  ["NGK-3012", "Manhole cover missing, hazard for pedestrians after dark", "Roads & Infrastructure", "Critical", "In Progress", "Station Road", "13 hr ago", null],
  ["NGK-3013", "Stray dog pack near school gate, parents concerned", "Public Safety", "Medium", "Open", "St. Xavier's Gate", "15 hr ago", null],
  ["NGK-3014", "Park boundary wall collapsed after last week's rain", "Parks & Environment", "Medium", "Open", "Lake Garden", "18 hr ago", null],
  ["NGK-3015", "Frequent power cuts every evening, no prior notice given", "Electricity", "High", "In Progress", "Ward 9 Colony", "20 hr ago", null],
  ["NGK-3016", "Contaminated water supply, residents reporting stomach illness", "Water Supply", "Critical", "Open", "Rampura Basti", "22 hr ago", null],
  ["NGK-3017", "Uncollected garbage attracting rats near residential block", "Sanitation & Waste", "Medium", "Resolved", "Gandhi Market", "1 day ago", "NGK-3003"],
  ["NGK-3018", "Faded zebra crossing near junior school, needs repainting", "Roads & Infrastructure", "Low", "Open", "Station Road Junction", "1 day ago", null],
  ["NGK-3019", "Public toilet in park locked and unusable for two weeks", "Parks & Environment", "Low", "Resolved", "Lake Garden", "2 days ago", null],
  ["NGK-3020", "Loose electric pole leaning after storm, risk of collapse", "Electricity", "Critical", "Resolved", "Ward 9 Colony", "2 days ago", null],
];

const MOCK_COMPLAINTS = RAW.map(([id, text, dept, priority, status, location, submitted, dup]) => ({
  id, text, dept, priority, status, location, submitted, dup,
}));

/* ------------------------------------------------------------------
   Hook
------------------------------------------------------------------ */
export function useComplaints() {
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  const [dept, setDept] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  /** Apply all active filters */
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (dept !== "All" && c.dept !== dept) return false;
      if (priority !== "All" && c.priority !== priority) return false;
      if (status !== "All" && c.status !== status) return false;
      if (search && !`${c.id} ${c.text}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [complaints, dept, priority, status, search]);

  /** Per-department complaint counts (for sidebar badges) */
  const deptCounts = useMemo(() => {
    const m = {};
    complaints.forEach((c) => {
      m[c.dept] = (m[c.dept] || 0) + 1;
    });
    return m;
  }, [complaints]);

  /** Derived summary stats */
  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter((c) => c.status === "Open").length,
    critical: complaints.filter((c) => c.priority === "Critical").length,
    duplicates: complaints.filter((c) => c.dup).length,
  }), [complaints]);

  /** Move a complaint to a new status */
  function updateStatus(id, newStatus) {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  }

  /** Retrieve a single complaint by ID (for detail view) */
  function getById(id) {
    return complaints.find((c) => c.id === id) || null;
  }

  return {
    // Data
    complaints,
    filtered,
    deptCounts,
    stats,
    // Filter state
    dept, setDept,
    priority, setPriority,
    status, setStatus,
    search, setSearch,
    // Actions
    updateStatus,
    getById,
  };
}
