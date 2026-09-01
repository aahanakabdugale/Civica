import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { LoadingState, EmptyState } from './StateComponents';
import './dashboard.css';

// Leaflet's default marker icons break under bundlers (webpack/vite) unless
// you re-point them like this. This is a well-known Leaflet+React gotcha —
// without it you'll see broken marker images.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRIORITY_COLORS = {
  Critical: '#C4432E',
  High: '#D9713C',
  Medium: '#D9A130',
  Low: '#4C9A6A',
};

// Build a colored circle-dot icon per priority level, so severity is
// readable on the map itself without opening every popup.
function priorityIcon(priority) {
  const color = PRIORITY_COLORS[priority] || '#4A6FA5';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/**
 * Internal layer component that draws/removes the leaflet.heat heatmap
 * on top of the map depending on the `active` flag. Must live inside
 * <MapContainer> because it needs the `useMap` hook.
 */
function HeatmapLayer({ points, active }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (active) {
      // intensity weight: 3rd value per point, boosted for higher priority
      const weighted = points.map(([lat, lng, weight]) => [lat, lng, weight || 0.5]);
      layerRef.current = L.heatLayer(weighted, { radius: 30, blur: 25, maxZoom: 17 });
      layerRef.current.addTo(map);
    }
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [active, points, map]);

  return null;
}

/**
 * MapView — plots complaint markers on a Leaflet/OSM map, with a toggle
 * to switch to a density heatmap.
 *
 * Props:
 *   complaints: array of {
 *     id, title, category, priority ('Critical'|'High'|'Medium'|'Low'),
 *     status, lat, lng, createdAt
 *   }
 *   loading: boolean
 *   center: [lat, lng]  (default centers roughly on India)
 */
export default function MapView({ complaints = [], loading = false, center = [20.5937, 78.9629] }) {
  const [heatmapOn, setHeatmapOn] = useState(false);

  const heatPoints = useMemo(() => {
    const weightByPriority = { Critical: 1, High: 0.75, Medium: 0.5, Low: 0.25 };
    return complaints
      .filter((c) => c.lat && c.lng)
      .map((c) => [c.lat, c.lng, weightByPriority[c.priority] || 0.5]);
  }, [complaints]);

  if (loading) {
    return (
      <div className="map-wrapper">
        <div className="map-container">
          <LoadingState label="Loading complaint locations..." />
        </div>
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="map-wrapper">
        <div className="map-container">
          <EmptyState
            icon="🗺️"
            title="No complaints to show on the map"
            description="Submitted complaints with a location will appear here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <button className="map-toggle" onClick={() => setHeatmapOn((v) => !v)}>
        {heatmapOn ? 'Show markers' : 'Show heatmap'}
      </button>

      <MapContainer center={center} zoom={5} className="map-container" scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {heatmapOn && <HeatmapLayer points={heatPoints} active={heatmapOn} />}

        {!heatmapOn &&
          complaints
            .filter((c) => c.lat && c.lng)
            .map((c) => (
              <Marker key={c.id} position={[c.lat, c.lng]} icon={priorityIcon(c.priority)}>
                <Popup>
                  <div className="map-popup">
                    <h4>{c.title}</h4>
                    <p>Category: {c.category}</p>
                    <p>
                      Priority:{' '}
                      <span className={`priority-badge priority-${(c.priority || '').toLowerCase()}`}>
                        {c.priority}
                      </span>
                    </p>
                    <p>Status: {c.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}