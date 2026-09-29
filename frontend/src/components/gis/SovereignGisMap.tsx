"use client";

import React, { useEffect, useRef, useState } from "react";
import { GeocodedHotspot, InfrastructureCategory } from "../../types";
import { SAMPLE_HOTSPOTS, CATEGORY_COLORS } from "../../lib/constants";
import { MapPin, Filter, Sparkles, Layers } from "lucide-react";

interface SovereignGisMapProps {
  onSelectHotspotForMemo: (districtName: string, category: string) => void;
}

export const SovereignGisMap: React.FC<SovereignGisMapProps> = ({
  onSelectHotspotForMemo,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeDistrict, setActiveDistrict] = useState<string>("Varanasi");

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      // Import leaflet css
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Initialize map centered on India
      const map = L.map(mapContainerRef.current!, {
        center: [22.5, 82.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Dark Carto Voyager raster tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      // Filter and render markers
      renderMarkers(L, map);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers on category change
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return;
    import("leaflet").then((LModule) => {
      renderMarkers(LModule.default, mapInstanceRef.current);
    });
  }, [selectedCategory]);

  const renderMarkers = (L: any, map: any) => {
    // Clear existing marker layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const filtered =
      selectedCategory === "all"
        ? SAMPLE_HOTSPOTS
        : SAMPLE_HOTSPOTS.filter((h) => h.category === selectedCategory);

    filtered.forEach((hotspot) => {
      const color = CATEGORY_COLORS[hotspot.category] || "#00E5FF";
      const radius = Math.max(6, Math.min(20, hotspot.excess_ratio * 4));

      const marker = L.circleMarker([hotspot.lat, hotspot.lng], {
        radius: radius,
        fillColor: color,
        color: "#FFFFFF",
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.75,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.5; padding: 4px;">
          <div style="font-weight: bold; font-size: 14px; color: ${color}; text-transform: uppercase;">
            ${hotspot.district} (${hotspot.state})
          </div>
          <div style="color: #94A3B8; margin-bottom: 6px;">MoPR LGD Code: ${hotspot.lgd_district_code}</div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">
              Petitions: <b>${hotspot.report_count}</b>
            </span>
            <span style="background: rgba(0,229,255,0.15); color: #00E5FF; padding: 2px 6px; border-radius: 4px;">
              ${hotspot.excess_ratio}x Excess
            </span>
          </div>
          <div style="font-size: 11px; text-transform: capitalize; color: #E2E8F0;">
            Sector: <b>${hotspot.category.replace("_", " ")}</b>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        setActiveDistrict(hotspot.district);
      });
    });
  };

  const categories = [
    { id: "all", label: "All Sectors" },
    { id: "roads", label: "Roads & Highways" },
    { id: "water_sanitation", label: "Water & Sanitation" },
    { id: "power", label: "Power & Energy" },
    { id: "health", label: "Health Infrastructure" },
    { id: "education", label: "Education & Schools" },
    { id: "public_safety", label: "Public Safety" },
  ];

  return (
    <div className="liquid-glass p-5 flex flex-col h-full border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accentCyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              Sovereign GIS Command Map (131 Geocoded LGD Hotspots)
            </h2>
          </div>
          <p className="text-xs text-mutedText">
            Real-time geospatial demand aggregation matched with MoPR 6-digit LGD boundaries
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                selectedCategory === cat.id
                  ? "bg-accentCyan text-[#070B14] font-bold shadow-cyanGlow"
                  : "bg-white/5 hover:bg-white/10 text-mutedText border border-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 min-h-[420px] rounded-lg overflow-hidden border border-white/10 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute top-3 right-3 z-[400] liquid-glass-strong p-2.5 rounded-lg border border-white/10 text-[11px] font-mono space-y-1">
          <div className="text-[10px] uppercase text-mutedText font-semibold flex items-center gap-1.5 mb-1">
            <Layers className="w-3 h-3 text-accentCyan" />
            <span>Demand Multiplier</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF]"></span>
            <span>&gt; 3.0× Excess (Critical)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7B00]"></span>
            <span>2.0× – 3.0× Excess (High)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]"></span>
            <span>&lt; 2.0× Baseline (Watch)</span>
          </div>
        </div>

        {/* District Action Card */}
        <div className="absolute bottom-3 left-3 z-[400] liquid-glass-strong px-3 py-2 rounded-lg border border-white/10 flex items-center gap-3">
          <div className="text-xs">
            <span className="text-mutedText">Active Hotspot:</span>{" "}
            <span className="text-white font-bold">{activeDistrict}</span>
          </div>
          <button
            onClick={() => onSelectHotspotForMemo(activeDistrict, "roads")}
            className="text-[11px] font-mono flex items-center gap-1 px-2.5 py-1 rounded bg-accentCyan/20 hover:bg-accentCyan/30 text-accentCyan border border-accentCyan/40 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>Cabinet Brief</span>
          </button>
        </div>
      </div>
    </div>
  );
};
