/**
 * Navbar.jsx — components/shared/
 * Top navigation bar used by the Authority Dashboard screen.
 *
 * Props:
 *   onLogout  () => void   — called when user clicks "Log out"
 *   username  string       — display name shown in top-right
 *   openCount   number     — # of open complaints (shown in stat strip)
 *   criticalCount number   — # of critical complaints
 *   dupCount    number     — # of flagged duplicates
 */

import { ShieldCheck, LogOut } from "lucide-react";
import { C, FONTS } from "./theme";

export default function Navbar({ onLogout, username = "authority", openCount = 0, criticalCount = 0, dupCount = 0 }) {
  return (
    <div
      style={{ borderBottom: `1px solid ${C.line}`, background: C.surface, fontFamily: "'IBM Plex Sans', sans-serif" }}
      className="flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4"
    >
      <style>{FONTS}</style>

      {/* Brand (mobile only — sidebar hides on md+) */}
      <div className="flex items-center gap-2 md:hidden">
        <ShieldCheck size={16} color={C.ink} />
        <span style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-base">
          Nagrik Ops
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
        <div>
          <span style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-2xl">
            {openCount}
          </span>
          <span style={{ color: C.muted }} className="text-sm ml-2">open</span>
        </div>
        <div>
          <span style={{ fontFamily: "'Fraunces', serif", color: C.critical }} className="text-2xl">
            {criticalCount}
          </span>
          <span style={{ color: C.muted }} className="text-sm ml-2">critical</span>
        </div>
        <div>
          <span style={{ fontFamily: "'Fraunces', serif", color: C.amber }} className="text-2xl">
            {dupCount}
          </span>
          <span style={{ color: C.muted }} className="text-sm ml-2">flagged duplicates</span>
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2" style={{ color: C.muted }}>
          <span className="text-sm hidden sm:inline">Signed in as</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.ink }} className="text-sm">
            {username}
          </span>
        </div>
        <button
          id="navbar-logout-btn"
          onClick={onLogout}
          style={{ color: C.muted }}
          className="flex items-center gap-1.5 text-sm hover:text-ink transition-colors"
          title="Log out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </div>
  );
}
