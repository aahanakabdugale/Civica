import React, { useCallback, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useI18n } from "../i18n";
import "leaflet/dist/leaflet.css";
import "./LocationPicker.css";

// Default marker icon fix (Leaflet's default icon path breaks under most bundlers)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [28.6139, 77.209]; // New Delhi — swap for your city

function ClickToPlace({ onPlace }) {
  useMapEvents({
    click(e) {
      onPlace([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Props:
 *  value: [lat, lng] | null
 *  onChange: (coords: [lat, lng]) => void
 */
export default function LocationPicker({ value, onChange }) {
  const { t } = useI18n();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const mapRef = useRef(null);

  const center = value || DEFAULT_CENTER;

  const handlePlace = useCallback(
    (coords) => {
      setGeoError(false);
      onChange(coords);
    },
    [onChange]
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        handlePlace(coords);
        mapRef.current?.flyTo(coords, 16);
        setLocating(false);
      },
      () => {
        setGeoError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="location-picker">
      <button
        type="button"
        className="location-picker__geo-btn"
        onClick={useMyLocation}
        disabled={locating}
      >
        {locating ? t("form.location.locating") : t("form.location.useMine")}
      </button>

      <div className="location-picker__map">
        <MapContainer
          center={center}
          zoom={value ? 16 : 12}
          scrollWheelZoom
          style={{ height: "260px", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPlace={handlePlace} />
          {value && (
            <Marker
              position={value}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  handlePlace([lat, lng]);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="location-picker__hint">{t("form.location.instructions")}</p>

      {value && (
        <p className="location-picker__status location-picker__status--ok">
          {t("form.location.captured")} · {value[0].toFixed(5)}, {value[1].toFixed(5)}
        </p>
      )}
      {geoError && (
        <p className="location-picker__status location-picker__status--error">
          {t("form.location.error")}
        </p>
      )}
    </div>
  );
}
