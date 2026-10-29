import React, { useState, useEffect, useRef } from 'react';
import { Parcel, Project, RiskLevel } from '../types';
import { RiskBadge, StageBadge } from '../components/RiskBadge';
import {
  MapPin,
  Layers,
  Filter,
  ShieldAlert,
  Info,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface GisMapPageProps {
  parcels: Parcel[];
  projects: Project[];
  selectedProjectId: string;
  onSelectParcel: (parcel: Parcel) => void;
}

export const GisMapPage: React.FC<GisMapPageProps> = ({
  parcels,
  projects,
  selectedProjectId,
  onSelectParcel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [projectFilter, setProjectFilter] = useState(selectedProjectId || 'all');
  const [riskFilter, setRiskFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [activeParcel, setActiveParcel] = useState<Parcel | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Filter parcels
  const filteredParcels = parcels.filter((p) => {
    if (projectFilter !== 'all' && p.projectId !== projectFilter) return false;
    if (riskFilter && p.riskCategory !== riskFilter) return false;
    if (stageFilter && p.stage !== stageFilter) return false;
    return true;
  });

  const highRiskCount = filteredParcels.filter((p) => p.riskCategory === 'high' || p.riskCategory === 'critical').length;

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'all') {
      setProjectFilter(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Dynamically load Leaflet if available in browser
  useEffect(() => {
    let isMounted = true;

    async function initLeafletMap() {
      if (!mapContainerRef.current) return;

      try {
        const L = (await import('leaflet')).default;
        if (!isMounted) return;

        if (!mapInstanceRef.current) {
          // Initialize map with center on Vadodara corridor anchor
          const map = L.map(mapContainerRef.current, {
            center: [22.3072, 73.1812],
            zoom: 12,
            zoomControl: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors | BhoomiPredict AI Synthetic GIS Demo',
            maxZoom: 18,
          }).addTo(map);

          markersLayerRef.current = L.layerGroup().addTo(map);
          mapInstanceRef.current = map;
          setLeafletLoaded(true);
        }
      } catch (err) {
        console.warn('Leaflet load notice (falling back to visual coordinate overlay):', err);
      }
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers when filtered parcels change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import('leaflet').then(({ default: L }) => {
      markersLayerRef.current.clearLayers();

      const bounds: [number, number][] = [];

      filteredParcels.forEach((parcel) => {
        if (!parcel.latitude || !parcel.longitude) return;

        bounds.push([parcel.latitude, parcel.longitude]);

        // Risk marker color
        const color =
          parcel.riskCategory === 'critical' ? '#EF4444' :
          parcel.riskCategory === 'high' ? '#F97316' :
          parcel.riskCategory === 'medium' ? '#F59E0B' : '#10B981';

        const circleMarker = L.circleMarker([parcel.latitude, parcel.longitude], {
          radius: parcel.criticalPath ? 9 : 7,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });

        circleMarker.bindTooltip(
          `<strong>${parcel.code}</strong><br/>${parcel.riskCategory?.toUpperCase()} RISK (+${parcel.estimatedDelayDays || 0}d)<br/>${parcel.stage}`,
          { direction: 'top' }
        );

        circleMarker.on('click', () => {
          setActiveParcel(parcel);
        });

        circleMarker.addTo(markersLayerRef.current);
      });

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    });
  }, [filteredParcels]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Interactive GIS Parcel Spatial Map</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial alignment with synthetic survey coordinates color-coded by predicted delay severity.
          </p>
        </div>

        {/* Legend pill */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
          <span className="font-semibold text-slate-600 text-[11px] mr-1">Risk Levels:</span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low (&lt;30%)
          </span>
          <span className="flex items-center gap-1 text-[11px] text-amber-700 ml-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-1 text-[11px] text-orange-700 ml-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-1 text-[11px] text-rose-700 ml-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical (≥80%)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Infrastructure Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Risk Categories</option>
            <option value="critical">Critical Risk</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Stages</option>
            <option value="identification">Identification</option>
            <option value="survey">Survey</option>
            <option value="ownership_verification">Ownership Verification</option>
            <option value="valuation_and_compensation">Valuation & Compensation</option>
            <option value="approval">Approval</option>
            <option value="possession">Possession</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            Showing <strong className="text-slate-900">{filteredParcels.length}</strong> spatial points
          </span>
          {highRiskCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold">
              {highRiskCount} High/Critical Risk
            </span>
          )}
        </div>
      </div>

      {/* Map Surface & Overlay Panel */}
      <div className="relative h-[560px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Spatial Notice Card */}
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200/90 shadow-md max-w-xs text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Synthetic Cadastral Demonstrator
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Points represent synthetic parcel boundaries mapped along the alignment. Click any node to review delay estimates.
          </p>
        </div>

        {/* Selected Marker Drawer / Card */}
        {activeParcel && (
          <div className="absolute bottom-4 right-4 z-20 bg-white p-4 rounded-xl border border-slate-200 shadow-xl max-w-sm w-full animate-in slide-in-from-bottom-2 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 text-sm">{activeParcel.code}</span>
                  {activeParcel.criticalPath && (
                    <span className="px-1 py-0.2 text-[9px] bg-rose-100 text-rose-800 font-bold rounded">CP</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{activeParcel.locationName}</div>
              </div>
              <button
                onClick={() => setActiveParcel(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-3 space-y-1.5 border-t border-b border-slate-100 py-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Acquisition Stage:</span>
                <StageBadge stage={activeParcel.stage} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Delay Risk Level:</span>
                <RiskBadge level={activeParcel.riskCategory} score={activeParcel.delayRiskScore} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delay:</span>
                <strong className="text-rose-600">+{activeParcel.estimatedDelayDays || 0} days</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ownership Title:</span>
                <span className="capitalize">{activeParcel.ownershipVerificationStatus.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coordinates:</span>
                <span className="font-mono text-[10px] text-slate-600">
                  {activeParcel.latitude?.toFixed(4)}, {activeParcel.longitude?.toFixed(4)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectParcel(activeParcel)}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <span>Inspect Feature Attributions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
