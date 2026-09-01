/**
 * Login.jsx — pages/
 * Authority login page for the Civica grievance management system.
 *
 * Props:
 *   onLogin  () => void  — called after successful credential check
 *
 * Demo credentials: authority / grievance2026
 */

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { C, FONTS } from "../components/shared/theme";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (username.trim() === "authority" && password === "grievance2026") {
      setError(false);
      setLoading(true);
      // Simulate brief auth delay for realism
      setTimeout(() => {
        setLoading(false);
        onLogin();
      }, 400);
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.paper, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{FONTS}</style>
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <ShieldCheck size={20} color={C.ink} />
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: C.muted,
              letterSpacing: 1,
            }}
            className="text-xs"
          >
            authority console
          </span>
        </div>

        <h1
          style={{ fontFamily: "'Fraunces', serif", color: C.ink }}
          className="text-4xl text-center mb-1"
        >
          Nagrik Ops
        </h1>
        <p style={{ color: C.muted }} className="text-center text-sm mb-10">
          Sign in to view and act on citizen grievances.
        </p>

        {/* Form card */}
        <div
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
          className="p-6 space-y-4"
        >
          {/* Username */}
          <div>
            <label htmlFor="login-username" style={{ color: C.ink }} className="text-sm block mb-1">
              Username
            </label>
            <input
              id="login-username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ border: `1px solid ${error ? C.critical : C.line}`, borderRadius: 3, background: "white" }}
              className="w-full px-3 py-2 text-sm outline-none"
              placeholder="authority"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" style={{ color: C.ink }} className="text-sm block mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ border: `1px solid ${error ? C.critical : C.line}`, borderRadius: 3, background: "white" }}
              className="w-full px-3 py-2 text-sm outline-none"
              placeholder="••••••••••"
              autoComplete="current-password"
            />
          </div>

          {/* Error message */}
          {error && (
            <p style={{ color: C.critical }} className="text-sm">
              Incorrect username or password.
            </p>
          )}

          {/* Submit */}
          <button
            id="login-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? C.muted : C.ink,
              color: C.paper,
              borderRadius: 3,
              transition: "background 0.2s",
            }}
            className="w-full py-2 text-sm font-medium mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <p style={{ color: C.muted }} className="text-center text-xs mt-4">
          Demo access — <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>authority</span>{" "}
          /{" "}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>grievance2026</span>
        </p>
      </div>
    </div>
  );
}
