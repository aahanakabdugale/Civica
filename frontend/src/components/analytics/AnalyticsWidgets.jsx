import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { LoadingState, EmptyState } from './StateComponents';
import './dashboard.css';

/**
 * AnalyticsWidgets — the four analytics pieces from the PRD:
 *   - complaints/day (line chart)
 *   - top categories (bar chart)
 *   - avg resolution time (stat card)
 *   - overall counts by category/priority (stat cards)
 *
 * Props:
 *   complaints: array of {
 *     id, category, priority, status, createdAt (ISO string), resolvedAt (ISO string | null)
 *   }
 *   loading: boolean
 */
export default function AnalyticsWidgets({ complaints = [], loading = false }) {
  const stats = useMemo(() => computeStats(complaints), [complaints]);

  if (loading) {
    return (
      <div className="dash-card">
        <LoadingState label="Crunching the numbers..." />
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="dash-card">
        <EmptyState
          icon="📊"
          title="No data to analyze yet"
          description="Analytics will populate once complaints start coming in."
        />
      </div>
    );
  }

  return (
    <div className="dash-section">
      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Total complaints</p>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Open</p>
          <p className="stat-value">{stats.open}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Resolved</p>
          <p className="stat-value">{stats.resolved}</p>
          <p className="stat-sub">{stats.resolvedPct}% of total</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg. resolution time</p>
          <p className="stat-value">{stats.avgResolutionDays ?? '—'}</p>
          <p className="stat-sub">{stats.avgResolutionDays ? 'days' : 'no resolved complaints yet'}</p>
        </div>
      </div>

      {/* Complaints per day */}
      <div className="dash-card" style={{ marginBottom: 16 }}>
        <p className="stat-label" style={{ marginBottom: 12 }}>Complaints per day</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats.perDay}>
            <CartesianGrid stroke="#E2E5EA" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8891A3' }} axisLine={{ stroke: '#E2E5EA' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8891A3' }} axisLine={{ stroke: '#E2E5EA' }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#1B2A4A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top categories */}
      <div className="dash-card">
        <p className="stat-label" style={{ marginBottom: 12 }}>Top categories</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.byCategory} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid stroke="#E2E5EA" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#8891A3' }} axisLine={{ stroke: '#E2E5EA' }} />
            <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 12, fill: '#1B2A4A' }} axisLine={{ stroke: '#E2E5EA' }} />
            <Tooltip />
            <Bar dataKey="count" fill="#4A6FA5" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function computeStats(complaints) {
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'Resolved');
  const open = total - resolved.length;

  // Avg resolution time in days, for complaints that have both timestamps
  const resolutionDurations = resolved
    .filter((c) => c.createdAt && c.resolvedAt)
    .map((c) => (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));

  const avgResolutionDays = resolutionDurations.length
    ? (resolutionDurations.reduce((a, b) => a + b, 0) / resolutionDurations.length).toFixed(1)
    : null;

  // Group by day (YYYY-MM-DD) for the last 14 days of data present
  const dayMap = {};
  complaints.forEach((c) => {
    if (!c.createdAt) return;
    const day = c.createdAt.slice(0, 10);
    dayMap[day] = (dayMap[day] || 0) + 1;
  });
  const perDay = Object.entries(dayMap)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count })); // MM-DD label

  // Group by category, sorted descending, top 6
  const catMap = {};
  complaints.forEach((c) => {
    const cat = c.category || 'Uncategorized';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const byCategory = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    total,
    open,
    resolved: resolved.length,
    resolvedPct: total ? Math.round((resolved.length / total) * 100) : 0,
    avgResolutionDays,
    perDay,
    byCategory,
  };
}