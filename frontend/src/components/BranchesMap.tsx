"use client";

import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
import { MapPin, Phone, Clock, Calendar } from "lucide-react";

interface Phone {
  id: number;
  phone: string;
}

interface Branch {
  id: number;
  name: string;
  location: string;
  image: string;
  image_url: string;
  area: string;
  city: string;
  district: string;
  open: string;
  time: string;
  latitude: string;
  longitude: string;
  phones: Phone[];
}

type Props = {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelect: (b: Branch) => void;
};

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Mongolian center as default
const defaultCenter = {
  lat: 47.9184,
  lng: 106.9177,
};

const getCustomMarkerIcon = (isSelected: boolean) => {
  if (typeof window !== 'undefined' && (window as any).google) {
    const color = isSelected ? '%2314B8A6' : '%2306B6D4'; // teal-600 : cyan-500
    const size = isSelected ? 50 : 40;
    
    return {
      url: `data:image/svg+xml,%3Csvg width='${size}' height='${size}' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='${color}' stroke='white' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='white'/%3E%3C/svg%3E`,
      scaledSize: new (window as any).google.maps.Size(size, size),
      origin: new (window as any).google.maps.Point(0, 0),
      anchor: new (window as any).google.maps.Point(size / 2, size),
    };
  }
  return undefined;
};

export default function BranchesMap({ branches, selectedBranch, onSelect }: Props) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<Branch | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
  });

  // Fit all branches in view
  useEffect(() => {
    if (!mapReady || branches.length === 0 || !mapRef.current) return;

    // Single branch
    if (branches.length === 1) {
      const b = branches[0];
      if (!b.latitude || !b.longitude) return;

      mapRef.current.setCenter({
        lat: parseFloat(b.latitude),
        lng: parseFloat(b.longitude),
      });
      mapRef.current.setZoom(15);
      return;
    }

    // Multiple branches → fit bounds
    const bounds = new google.maps.LatLngBounds();

    branches.forEach((b) => {
      if (b.latitude && b.longitude) {
        bounds.extend({
          lat: parseFloat(b.latitude),
          lng: parseFloat(b.longitude),
        });
      }
    });

    mapRef.current.fitBounds(bounds);
    
    // Add padding
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    mapRef.current.fitBounds(bounds, padding);
  }, [branches, mapReady]);

  // When card is clicked, pan to that branch
  useEffect(() => {
    if (!mapRef.current || !selectedBranch?.latitude) return;

    mapRef.current.panTo({
      lat: parseFloat(selectedBranch.latitude),
      lng: parseFloat(selectedBranch.longitude),
    });
    mapRef.current.setZoom(16);
    setActiveMarker(selectedBranch);
  }, [selectedBranch]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-3"></div>
          <p className="text-sm text-gray-600 font-medium">
            Газрын зураг ачааллаж байна...
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      onLoad={(map) => {
        mapRef.current = map;
        window.google.maps.event.trigger(map, "resize");
        setMapReady(true);
      }}
      options={{
        scrollwheel: true,
        gestureHandling: "auto",
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      }}
    >
      {branches.map((b) =>
        b.latitude && b.longitude ? (
          <Marker
            key={b.id}
            position={{
              lat: parseFloat(b.latitude),
              lng: parseFloat(b.longitude),
            }}
            onClick={() => {
              setActiveMarker(b);
              onSelect(b);
            }}
            title={b.name}
            icon={getCustomMarkerIcon(selectedBranch?.id === b.id)}
            animation={
              selectedBranch?.id === b.id
                ? google.maps.Animation.BOUNCE
                : undefined
            }
          />
        ) : null
      )}

      {activeMarker?.latitude && activeMarker.longitude && (
        <InfoWindow
          position={{
            lat: parseFloat(activeMarker.latitude),
            lng: parseFloat(activeMarker.longitude),
          }}
          onCloseClick={() => setActiveMarker(null)}
          options={{
            pixelOffset: new google.maps.Size(0, 100),
          }}
        >
          <div className="min-w-[250px] max-w-[10px]">
            {/* Зураг */}
            {activeMarker.image_url && (
              <div className="relative h-30 w-full mb-3 -mx-4 -mt-4 rounded-t-lg overflow-hidden">
                <img
                  src={`http://127.0.0.1:8000${activeMarker.image_url}`}
                  alt={activeMarker.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-branch.jpg";
                  }}
                />
              </div>
            )}

            <h3 className="font-bold text-gray-900 text-lg mb-3">
              {activeMarker.name}
            </h3>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{activeMarker.location}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {activeMarker.area}, {activeMarker.city}, {activeMarker.district}-р хороо
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-sm">{activeMarker.open}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-sm">{activeMarker.time}</span>
              </div>

              {activeMarker.phones && activeMarker.phones.length > 0 && (
                <div className="flex items-start gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm space-y-1">
                    {activeMarker.phones.map((phone) => (
                      <a
                        key={phone.id}
                        href={`tel:${phone.phone}`}
                        className="block hover:text-teal-600 transition-colors font-medium"
                      >
                        {phone.phone}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeMarker.latitude},${activeMarker.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
            >
              <MapPin className="w-4 h-4" />
              Чиглэл авах
            </a>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}