import { useState, useMemo } from "react";
import { Search, LogOut, MapPin, X, ShieldCheck, Copy } from "lucide-react";

/* ---------------------------------------------------------
   Tokens
--------------------------------------------------------- */
const C = {
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

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

/* ---------------------------------------------------------
   Mock data
--------------------------------------------------------- */
const DEPARTMENTS = [
  "Roads & Infrastructure",
  "Water Supply",
  "Sanitation & Waste",
  "Electricity",
  "Public Safety",
  "Parks & Environment",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Resolved"];

const RAW_COMPLAINTS = [
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

const COMPLAINTS = RAW_COMPLAINTS.map(
  ([id, text, dept, priority, status, location, submitted, dup]) => ({
    id, text, dept, priority, status, location, submitted, dup,
  })
);

/* ---------------------------------------------------------
   Small pieces
--------------------------------------------------------- */
function priorityColor(p) {
  if (p === "Critical") return C.critical;
  if (p === "High") return C.amber;
  if (p === "Medium") return C.teal;
  return C.muted;
}
function statusColor(s) {
  if (s === "Open") return C.amber;
  if (s === "In Progress") return C.teal;
  return C.sage;
}

function Dot({ color }) {
  return (
    <span
      style={{ background: color }}
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
    />
  );
}

function Pill({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 text-sm transition-colors"
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        border: `1px solid ${active ? (color || C.ink) : C.line}`,
        borderRadius: 3,
        color: active ? (color || C.ink) : C.muted,
        background: active ? `${(color || C.ink)}14` : "transparent",
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------
   Login
--------------------------------------------------------- */
function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);

  const submit = () => {
    if (u.trim() === "authority" && p === "grievance2026") {
      setErr(false);
      onLogin();
    } else {
      setErr(true);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.paper, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{FONTS}</style>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <ShieldCheck size={20} color={C.ink} />
          <span
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted, letterSpacing: 1 }}
            className="text-xs"
          >
            authority console
          </span>
        </div>

        <h1
          style={{ fontFamily: "'Fraunces', serif", color: C.ink }}
          className="text-4xl text-center mb-1"
        >
          Civica
        </h1>
        <p style={{ color: C.muted }} className="text-center text-sm mb-10">
          Sign in to view and act on citizen grievances.
        </p>

        <div
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
          className="p-6 space-y-4"
        >
          <div>
            <label style={{ color: C.ink }} className="text-sm block mb-1">
              Username
            </label>
            <input
              value={u}
              onChange={(e) => setU(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: "white" }}
              className="w-full px-3 py-2 text-sm outline-none"
              placeholder="authority"
            />
          </div>
          <div>
            <label style={{ color: C.ink }} className="text-sm block mb-1">
              Password
            </label>
            <input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: "white" }}
              className="w-full px-3 py-2 text-sm outline-none"
              placeholder="••••••••••"
            />
          </div>

          {err && (
            <p style={{ color: C.critical }} className="text-sm">
              Incorrect username or password.
            </p>
          )}

          <button
            onClick={submit}
            style={{ background: C.ink, color: C.paper, borderRadius: 3 }}
            className="w-full py-2 text-sm font-medium mt-2"
          >
            Sign in
          </button>
        </div>

        <p style={{ color: C.muted }} className="text-center text-xs mt-4">
          Demo access — authority / grievance2026
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Detail drawer — status update flow
--------------------------------------------------------- */
function Drawer({ complaint, onClose, onStatusChange }) {
  if (!complaint) return null;
  const steps = STATUSES;
  const currentIdx = steps.indexOf(complaint.status);

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(28,43,57,0.35)" }}
      />
      <div
        style={{ background: C.surface, borderLeft: `1px solid ${C.line}`, fontFamily: "'IBM Plex Sans', sans-serif" }}
        className="relative w-full max-w-md h-full overflow-y-auto p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <span
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted }}
              className="text-xs"
            >
              {complaint.id}
            </span>
            <h2 style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-2xl mt-1">
              {complaint.dept}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: C.muted }}>
            <X size={20} />
          </button>
        </div>

        {complaint.dup && (
          <div
            style={{ border: `1px solid ${C.amber}`, background: `${C.amber}12`, borderRadius: 3, color: C.ink }}
            className="flex items-center gap-2 text-sm px-3 py-2 mb-5"
          >
            <Copy size={14} color={C.amber} />
            Flagged as a likely duplicate of{" "}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{complaint.dup}</span>
          </div>
        )}

        <p style={{ color: C.ink }} className="text-base leading-relaxed mb-5">
          {complaint.text}
        </p>

        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: C.muted }}>
          <MapPin size={14} />
          {complaint.location}
        </div>
        <div style={{ color: C.muted }} className="text-sm mb-6">
          Submitted {complaint.submitted}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Dot color={priorityColor(complaint.priority)} />
          <span style={{ color: C.ink }} className="text-sm font-medium">
            {complaint.priority} priority
          </span>
        </div>

        <div style={{ borderTop: `1px solid ${C.line}` }} className="pt-5">
          <p style={{ color: C.ink }} className="text-sm font-medium mb-3">
            Update status
          </p>
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <button
                  onClick={() => onStatusChange(complaint.id, s)}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: i <= currentIdx ? statusColor(s) : "transparent",
                      border: `2px solid ${i <= currentIdx ? statusColor(s) : C.line}`,
                    }}
                  />
                  <span
                    style={{ color: i === currentIdx ? C.ink : C.muted, fontWeight: i === currentIdx ? 600 : 400 }}
                    className="text-xs"
                  >
                    {s}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div
                    style={{ height: 2, background: i < currentIdx ? statusColor(steps[i + 1]) : C.line }}
                    className="flex-1 -mt-5"
                  />
                )}
              </div>
            ))}
          </div>
          <p style={{ color: C.muted }} className="text-xs mt-5">
            Selecting a stage updates this complaint immediately and is visible to the citizen on their tracking page.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Dashboard
--------------------------------------------------------- */
function Dashboard({ onLogout }) {
  const [complaints, setComplaints] = useState(COMPLAINTS);
  const [dept, setDept] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (dept !== "All" && c.dept !== dept) return false;
      if (priority !== "All" && c.priority !== priority) return false;
      if (status !== "All" && c.status !== status) return false;
      if (search && !`${c.id} ${c.text}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [complaints, dept, priority, status, search]);

  const deptCounts = useMemo(() => {
    const m = {};
    DEPARTMENTS.forEach((d) => (m[d] = complaints.filter((c) => c.dept === d).length));
    return m;
  }, [complaints]);

  const openCount = complaints.filter((c) => c.status === "Open").length;
  const criticalCount = complaints.filter((c) => c.priority === "Critical").length;
  const dupCount = complaints.filter((c) => c.dup).length;

  const selected = complaints.find((c) => c.id === selectedId) || null;

  const handleStatusChange = (id, newStatus) => {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: C.paper, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{FONTS}</style>

      {/* Sidebar */}
      <div
        style={{ borderRight: `1px solid ${C.line}`, background: C.surface }}
        className="w-60 flex-shrink-0 hidden md:flex flex-col p-5"
      >
        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck size={18} color={C.ink} />
          <span style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-lg">
            Civica
          </span>
        </div>

        <p style={{ color: C.muted }} className="text-xs mb-3">
          Departments
        </p>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setDept("All")}
            style={{ color: dept === "All" ? C.ink : C.muted, fontWeight: dept === "All" ? 600 : 400 }}
            className="flex items-center justify-between text-sm py-1.5 text-left"
          >
            All complaints
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">
              {complaints.length}
            </span>
          </button>
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              style={{ color: dept === d ? C.ink : C.muted, fontWeight: dept === d ? 600 : 400 }}
              className="flex items-center justify-between text-sm py-1.5 text-left"
            >
              <span className="truncate pr-2">{d}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs flex-shrink-0">
                {deptCounts[d]}
              </span>
            </button>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-auto pt-4">
          <button
            onClick={onLogout}
            style={{ color: C.muted }}
            className="flex items-center gap-2 text-sm"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top stat strip */}
        <div
          style={{ borderBottom: `1px solid ${C.line}` }}
          className="flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4"
        >
          <div>
            <span style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-2xl">
              {openCount}
            </span>
            <span style={{ color: C.muted }} className="text-sm ml-2">
              open
            </span>
          </div>
          <div>
            <span style={{ fontFamily: "'Fraunces', serif", color: C.critical }} className="text-2xl">
              {criticalCount}
            </span>
            <span style={{ color: C.muted }} className="text-sm ml-2">
              critical
            </span>
          </div>
          <div>
            <span style={{ fontFamily: "'Fraunces', serif", color: C.amber }} className="text-2xl">
              {dupCount}
            </span>
            <span style={{ color: C.muted }} className="text-sm ml-2">
              flagged duplicates
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2" style={{ color: C.muted }}>
            <span className="text-sm hidden sm:inline">Signed in as</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.ink }} className="text-sm">
              authority
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-3">
          <div
            style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: C.surface }}
            className="flex items-center gap-2 px-3 py-1.5"
          >
            <Search size={14} color={C.muted} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints..."
              style={{ color: C.ink }}
              className="text-sm outline-none bg-transparent w-40"
            />
          </div>

          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: C.surface, color: C.ink }}
            className="text-sm px-2 py-1.5 md:hidden"
          >
            <option value="All">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <Pill active={priority === "All"} onClick={() => setPriority("All")}>All priority</Pill>
            {PRIORITIES.map((p) => (
              <Pill key={p} active={priority === p} onClick={() => setPriority(p)} color={priorityColor(p)}>
                {p}
              </Pill>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Pill active={status === "All"} onClick={() => setStatus("All")}>All status</Pill>
            {STATUSES.map((s) => (
              <Pill key={s} active={status === s} onClick={() => setStatus(s)} color={statusColor(s)}>
                {s}
              </Pill>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 pb-6">
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
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{ borderBottom: `1px solid ${C.line}` }}
                  className="cursor-pointer hover:bg-white transition-colors"
                >
                  <td className="py-3 pr-4" style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.muted }}>
                    {c.id}
                  </td>
                  <td className="py-3 pr-4 max-w-xs" style={{ color: C.ink }}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{c.text}</span>
                      {c.dup && <Copy size={12} color={C.amber} className="flex-shrink-0" />}
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell" style={{ color: C.ink }}>
                    {c.dept}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Dot color={priorityColor(c.priority)} />
                      <span style={{ color: C.ink }}>{c.priority}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Dot color={statusColor(c.status)} />
                      <span style={{ color: C.ink }}>{c.status}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden xl:table-cell" style={{ color: C.muted }}>
                    {c.location}
                  </td>
                  <td className="py-3" style={{ color: C.muted }}>
                    {c.submitted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: C.muted }}>
              No complaints match these filters. Adjust department, priority or status to see more.
            </div>
          )}
        </div>
      </div>

      <Drawer complaint={selected} onClose={() => setSelectedId(null)} onStatusChange={handleStatusChange} />
    </div>
  );
}

/* ---------------------------------------------------------
   Root
--------------------------------------------------------- */
export default function AuthorityConsole() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn ? (
    <Dashboard onLogout={() => setLoggedIn(false)} />
  ) : (
    <Login onLogin={() => setLoggedIn(true)} />
  );
}
