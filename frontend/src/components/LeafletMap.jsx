import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in bundled React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Priority Color Pin Generator
function createColoredIcon(priority, status) {
  let color = '#3b82f6'; // default blue
  if (status === 'RESOLVED' || status === 'CLOSED') {
    color = '#10b981'; // green
  } else if (priority === 'CRITICAL') {
    color = '#ef4444'; // red
  } else if (priority === 'HIGH') {
    color = '#f97316'; // orange
  } else if (priority === 'MEDIUM') {
    color = '#f59e0b'; // amber
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-pin',
    html: svg,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -38],
  });
}

export function LeafletMap({
  center = [12.9716, 77.5946],
  zoom = 13,
  markers = [],
  heatmapPoints = [],
  showHeatmap = false,
  isPicker = false,
  onLocationPick = null,
  pickedLocation = null,
  height = '420px',
  onMarkerClick = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerGroupRef = useRef(null);
  const heatmapLayerGroupRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  // 1. Initialize Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markerLayerGroupRef.current = L.layerGroup().addTo(map);
      heatmapLayerGroupRef.current = L.layerGroup().addTo(map);

      // Handle map clicks in picker mode
      map.on('click', (e) => {
        if (isPicker && onLocationPick) {
          onLocationPick({
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
          });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Picker Marker update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isPicker) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }

    if (pickedLocation && pickedLocation.lat && pickedLocation.lng) {
      const pin = L.marker([pickedLocation.lat, pickedLocation.lng], {
        draggable: true,
      }).addTo(map);

      pin.on('dragend', (e) => {
        const coord = e.target.getLatLng();
        if (onLocationPick) {
          onLocationPick({
            lat: Number(coord.lat.toFixed(6)),
            lng: Number(coord.lng.toFixed(6)),
          });
        }
      });

      pickerMarkerRef.current = pin;
      map.panTo([pickedLocation.lat, pickedLocation.lng]);
    }
  }, [pickedLocation, isPicker]);

  // 3. Render Markers & Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markerLayerGroupRef.current) return;

    markerLayerGroupRef.current.clearLayers();

    if (!showHeatmap && markers && markers.length > 0) {
      markers.forEach((m) => {
        if (!m.latitude || !m.longitude) return;

        const icon = createColoredIcon(m.priority, m.status);
        const marker = L.marker([m.latitude, m.longitude], { icon });

        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; max-width: 240px; padding: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;">
              ${m.complaint_id}
            </div>
            <div style="font-weight: 600; color: #0f172a; margin-top: 2px; line-height: 1.3;">
              ${m.title}
            </div>
            <div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
              <span style="background: #e2e8f0; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                ${m.category_name || m.category}
              </span>
              <span style="background: ${m.priority === 'CRITICAL' ? '#fee2e2' : m.priority === 'HIGH' ? '#ffedd5' : '#fef3c7'}; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                ${m.priority}
              </span>
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
              📍 ${m.address || 'Geo-located civic issue'}
            </div>
            <div style="margin-top: 8px;">
              <a href="/complaints/${m.id}" style="display: block; text-align: center; background: #2563eb; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-decoration: none;">
                View Details & Timeline &rarr;
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(m));
        }
        markerLayerGroupRef.current.addLayer(marker);
      });
    }
  }, [markers, showHeatmap]);

  // 4. Render Heatmap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !heatmapLayerGroupRef.current) return;

    heatmapLayerGroupRef.current.clearLayers();

    if (showHeatmap && heatmapPoints && heatmapPoints.length > 0) {
      // High-resolution visual heat density circles with radial gradients
      heatmapPoints.forEach(([lat, lng, weight]) => {
        const radius = 250 + (weight * 250); // meters
        const circle = L.circle([lat, lng], {
          radius: radius,
          fillColor: weight > 0.8 ? '#ef4444' : weight > 0.5 ? '#f97316' : '#eab308',
          fillOpacity: 0.35 + (weight * 0.25),
          stroke: false,
        });
        heatmapLayerGroupRef.current.addLayer(circle);

        // Core intensity point
        const innerCircle = L.circle([lat, lng], {
          radius: radius * 0.4,
          fillColor: '#b91c1c',
          fillOpacity: 0.6,
          stroke: false,
        });
        heatmapLayerGroupRef.current.addLayer(innerCircle);
      });
    }
  }, [heatmapPoints, showHeatmap]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {isPicker && (
        <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-700 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          Click anywhere or drag marker to set exact issue location
        </div>
      )}
    </div>
  );
}
