import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const LocationPicker = ({ location = { lat: 28.6139, lng: 77.2090, address: '', ward: '' }, onChange }) => {
  const { t } = useLanguage();
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null); // { type: 'success'|'error', text: '' }
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Dynamic Leaflet Loader
  useEffect(() => {
    let isMounted = true;

    const initLeafletMap = () => {
      if (!window.L || !mapContainerRef.current) return;

      const currentLat = location.lat || 28.6139;
      const currentLng = location.lng || 77.2090;

      // Avoid re-initialization
      if (!mapInstanceRef.current) {
        const map = window.L.map(mapContainerRef.current, {
          center: [currentLat, currentLng],
          zoom: 15,
          zoomControl: true,
        });

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom Leaflet marker icon
        const customIcon = window.L.divIcon({
          className: 'custom-map-pin',
          html: `<div class="pin-pulse"></div><div class="pin-head">📍</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const marker = window.L.marker([currentLat, currentLng], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);

        marker.on('dragend', async (event) => {
          const position = event.target.getLatLng();
          handlePositionUpdate(position.lat, position.lng, true);
        });

        map.on('click', async (event) => {
          const { lat, lng } = event.latlng;
          marker.setLatLng([lat, lng]);
          handlePositionUpdate(lat, lng, true);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      } else {
        mapInstanceRef.current.setView([currentLat, currentLng], 15);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([currentLat, currentLng]);
        }
      }
    };

    // Load Leaflet CSS and JS if not already loaded in document
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        if (isMounted) initLeafletMap();
      };
      document.body.appendChild(script);
    } else {
      initLeafletMap();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update position & reverse geocode address
  const handlePositionUpdate = async (lat, lng, shouldReverseGeocode = true) => {
    let address = location.address;
    let ward = location.ward;

    if (shouldReverseGeocode) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: { 'Accept-Language': 'en' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            address = data.display_name.split(',').slice(0, 4).join(', ');
            ward = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'Ward 12';
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding error:', err);
      }
    }

    onChange({
      ...location,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address,
      ward: ward || location.ward || 'Central Municipal Ward',
    });
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusNotice({ type: 'error', text: t('gpsError') });
      return;
    }

    setIsLocating(true);
    setStatusNotice({ type: 'info', text: t('gpsSearching') });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setIsLocating(false);
        setStatusNotice({ type: 'success', text: t('gpsSuccess') });

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerInstanceRef.current.setLatLng([lat, lng]);
        }

        await handlePositionUpdate(lat, lng, true);
        setTimeout(() => setStatusNotice(null), 4000);
      },
      (error) => {
        setIsLocating(false);
        setStatusNotice({ type: 'error', text: `${t('gpsError')} (${error.message})` });
        setTimeout(() => setStatusNotice(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Address with Nominatim
  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=4`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch (err) {
      console.warn('Search geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerInstanceRef.current.setLatLng([lat, lng]);
    }

    const simpleAddress = item.display_name.split(',').slice(0, 4).join(', ');
    
    onChange({
      ...location,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: simpleAddress,
      ward: location.ward || 'Municipal Ward',
    });

    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="location-picker-section">
      <div className="section-header-row">
        <div>
          <label className="field-label">{t('locationLabel')}</label>
          <p className="field-subtitle">{t('locationSubtitle')}</p>
        </div>
        <button
          type="button"
          className="btn-gps-action"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
        >
          <span className={`gps-radar-icon ${isLocating ? 'pulsing' : ''}`}>🎯</span>
          {isLocating ? t('gpsSearching') : t('gpsButton')}
        </button>
      </div>

      {statusNotice && (
        <div className={`location-status-banner banner-${statusNotice.type}`}>
          {statusNotice.text}
        </div>
      )}

      {/* Search Address Bar */}
      <div className="location-search-box">
        <form onSubmit={handleSearchAddress} className="search-input-group">
          <input
            type="text"
            className="input-field search-input"
            placeholder={t('searchLocationPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-search-loc" disabled={isSearching}>
            {isSearching ? '...' : '🔍 Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                className="search-result-item"
                onClick={() => selectSearchResult(item)}
              >
                📍 {item.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Canvas */}
      <div className="map-wrapper">
        <div ref={mapContainerRef} className="leaflet-map-canvas" />
        <div className="map-overlay-instructions">
          {t('mapPinInstructions')}
        </div>
      </div>

      {/* Address & Lat/Lng Inputs */}
      <div className="location-fields-grid">
        <div className="field-group span-full">
          <label className="subfield-label">{t('addressLabel')}</label>
          <input
            type="text"
            className="input-field"
            placeholder={t('addressPlaceholder')}
            value={location.address || ''}
            onChange={(e) => onChange({ ...location, address: e.target.value })}
            required
          />
        </div>

        <div className="field-group">
          <label className="subfield-label">{t('latitude')}</label>
          <input
            type="text"
            className="input-field coordinate-input"
            value={location.lat || ''}
            readOnly
          />
        </div>

        <div className="field-group">
          <label className="subfield-label">{t('longitude')}</label>
          <input
            type="text"
            className="input-field coordinate-input"
            value={location.lng || ''}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};
