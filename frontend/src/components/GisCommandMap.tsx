import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GisHotspot, DemandSignal } from '../types';

interface GisCommandMapProps {
  hotspots: GisHotspot[];
  signals: DemandSignal[];
}

export const GisCommandMap: React.FC<GisCommandMapProps> = ({ hotspots, signals }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHotspot, setSelectedHotspot] = useState<GisHotspot | null>(null);

  const getCategoryColor = (cat: string): string => {
    switch (cat.toLowerCase()) {
      case 'roads': return '#B45309';
      case 'water_sanitation': return '#0284C7';
      case 'power': return '#CA8A04';
      case 'health': return '#16A34A';
      case 'education': return '#4F46E5';
      case 'public_safety': return '#DC2626';
      default: return '#52525B';
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([21.5, 80.0], 5);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB &copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = hotspots.filter((h) => {
      const matchCat = categoryFilter === 'all' || h.category === categoryFilter;
      const matchSearch = h.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    filtered.forEach((h) => {
      const radius = Math.min(22, Math.max(6, Math.sqrt(h.excess_ratio) * 3));
      const color = getCategoryColor(h.category);
      const lon = h.lon ?? h.lng ?? 80.0;

      const marker = L.circleMarker([h.lat, lon], {
        radius,
        fillColor: color,
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.8,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 4px 6px; font-size: 12px; color: #111;">
          <div style="font-weight: 700; text-transform: uppercase; font-size: 11px; color: #787774; margin-bottom: 2px;">
            ${h.category.replace(/_/g, ' ')} · LGD ${h.lgd}
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
            ${h.district}, ${h.state}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11.5px; margin-top: 6px; border-top: 1px solid #EAEAEA; padding-top: 6px;">
            <div>Reports: <strong>${h.report_count}</strong></div>
            <div>Excess: <strong>${h.excess_ratio}x</strong></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => setSelectedHotspot(h));
      markersRef.current.push(marker);
    });
  }, [hotspots, categoryFilter, searchQuery]);

  const filteredHotspots = hotspots.filter((h) => {
    const matchCat = categoryFilter === 'all' || h.category === categoryFilter;
    const matchSearch = h.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        h.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const focusDistrict = (h: GisHotspot) => {
    setSelectedHotspot(h);
    if (mapInstanceRef.current) {
      const lon = h.lon ?? h.lng ?? 80.0;
      mapInstanceRef.current.setView([h.lat, lon], 9, { animate: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header without academic fluff */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif text-charcoal font-semibold">
            Sovereign GIS Infrastructure Command Map
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Real-time geospatial hotspot clustering anchored to Ministry of Panchayati Raj Local Government Directory (LGD) centroids.
          </p>
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-[#B45309]"></span> Roads
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-[#0284C7]"></span> Water
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-[#CA8A04]"></span> Power
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span> Health
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span> Safety
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-[#4F46E5]"></span> Education
          </span>
        </div>
      </div>

      {/* Bento Grid: Map + Hotspot Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <div className="border border-border rounded-card overflow-hidden bg-surface relative h-[480px]">
            <div ref={mapContainerRef} className="w-full h-full z-10" />
          </div>
          <div className="text-xs text-secondary flex justify-between items-center px-1">
            <span>Spatial Layer: MoPR LGD 6-digit centroids</span>
            <span className="font-mono">{filteredHotspots.length} hotspots active</span>
          </div>
        </div>

        {/* Hotspot Ledger (5 cols) */}
        <div className="lg:col-span-5 border border-border rounded-card bg-surface p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-lg font-semibold text-charcoal">
                Priority Intervention Hotspots
              </h4>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
                Top Elevated Demand
              </span>
            </div>

            {/* Filter Search & Category Pills */}
            <div className="flex flex-col gap-2.5 mb-3.5">
              <input
                type="text"
                placeholder="Filter district or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs px-3 py-1.5 border border-border rounded bg-surface-subtle text-charcoal placeholder:text-secondary focus:outline-none focus:border-charcoal"
              />
              <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                {['all', 'roads', 'water_sanitation', 'power', 'health', 'public_safety', 'education'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      categoryFilter === cat
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'border-border text-secondary hover:text-charcoal'
                    }`}
                  >
                    {cat === 'water_sanitation' ? 'water' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto max-h-[300px] border border-border rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-secondary font-mono uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Reports</th>
                    <th className="py-2 px-3 text-right">Excess</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHotspots.slice(0, 10).map((h, i) => (
                    <tr
                      key={i}
                      onClick={() => focusDistrict(h)}
                      className="hover:bg-surface-subtle cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-charcoal">
                        {h.district}
                        <span className="block text-[10px] font-mono text-secondary">
                          LGD {h.lgd}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-mono capitalize">
                          {h.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        {h.report_count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-pastel-red-text">
                        {h.excess_ratio}x
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            focusDistrict(h);
                          }}
                          className="text-[10px] font-mono px-2 py-0.5 border border-border rounded hover:bg-charcoal hover:text-white transition-colors"
                        >
                          Focus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedHotspot && (
            <div className="mt-3 p-3 rounded bg-surface-subtle border border-border text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-charcoal">{selectedHotspot.district}</span>{' '}
                <span className="text-secondary">({selectedHotspot.category.replace(/_/g, ' ')})</span>
                <div className="text-[11px] text-secondary">
                  Excess ratio: {selectedHotspot.excess_ratio}x baseline. LGD Code {selectedHotspot.lgd}.
                </div>
              </div>
              <button
                onClick={() => focusDistrict(selectedHotspot)}
                className="px-2.5 py-1 text-xs bg-charcoal text-white rounded hover:bg-secondary transition-colors"
              >
                Center
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
