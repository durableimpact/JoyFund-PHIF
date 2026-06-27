'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, ScaleControl, type MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_STYLE_URL = 'https://api.maptiler.com/maps/base-v4/style.json?key=UgzmN0nKdBnnOlC972W0';

const MARKER_ELEMENT = (
  <div
    style={{
      width: 24,
      height: 24,
      borderRadius: '50% 50% 50% 0',
      background: '#e11d48',
      transform: 'rotate(-45deg)',
      border: '2px solid white',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    }}
  />
);

interface LocationPickerMapProps {
  value: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  const [viewState, setViewState] = useState({
    longitude: value ? value[1] : 11.502,
    latitude: value ? value[0] : 3.848,
    zoom: value ? 15 : 6,
  });

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const { lngLat } = event;
      const lat = Math.round(lngLat.lat * 1e6) / 1e6;
      const lng = Math.round(lngLat.lng * 1e6) / 1e6;
      onChange(lat, lng);

      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
    },
    [onChange]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;

    map.flyTo({ center: [value[1], value[0]], zoom: 15, duration: 1000 });
  }, [value]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on('geolocate', (e: any) => {
      const { coords } = e;
      const lat = Math.round(coords.latitude * 1e6) / 1e6;
      const lng = Math.round(coords.longitude * 1e6) / 1e6;
      map.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
    });
  }, []);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleClick}
        onLoad={handleMapLoad}
        scrollZoom={false}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPTILER_STYLE_URL}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-left" />
        {value && (
          <Marker longitude={value[1]} latitude={value[0]} anchor="center">
            {MARKER_ELEMENT}
          </Marker>
        )}
      </Map>
    </div>
  );
}
