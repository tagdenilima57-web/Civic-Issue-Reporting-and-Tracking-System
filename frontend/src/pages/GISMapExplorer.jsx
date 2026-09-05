import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { LeafletMap } from '../components/LeafletMap';
import { 
  MapPin, Flame, Layers, Filter, CheckCircle2, 
  AlertTriangle, RefreshCw, Eye, Info
} from 'lucide-react';

export function GISMapExplorer({ setSelectedComplaintId, setTrackId, setActivePage }) {
  const [mapData, setMapData] = useState({ markers: [], heatmap_points: [], center: { lat: 12.9716, lng: 77.5946 } });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Layer state
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [categoryFilter, statusFilter]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await api.getGISMapData(params);
      setMapData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedComplaintId(marker.id);
    setTrackId(marker.complaint_id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">City GIS Spatial Map & Heatmap</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            OpenStreetMap geospatial visualization of civic grievances, priority hotspots, and departmental zones.
          </p>
        </div>

        {/* Layer Toggle Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setShowHeatmap(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              !showHeatmap
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Issue Markers
          </button>
          <button
            type="button"
            onClick={() => setShowHeatmap(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Density Heatmap
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
          >
            <option value="ALL">All Lifecycle Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
          {!showHeatmap ? (
            <>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Resolved</span>
            </>
          ) : (
            <span className="text-amber-800 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              Red/Orange zones indicate high grievance concentration density
            </span>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="h-[550px] relative rounded-2xl overflow-hidden border border-slate-200 shadow-md">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-[500] text-xs font-semibold text-slate-600">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
            Updating GIS layers...
          </div>
        )}

        <LeafletMap
          center={[mapData.center?.lat || 12.9716, mapData.center?.lng || 77.5946]}
          zoom={13}
          markers={mapData.markers}
          heatmapPoints={mapData.heatmap_points}
          showHeatmap={showHeatmap}
          height="100%"
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Spatial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            {mapData.markers?.length || 0}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Total Geolocated Points</p>
            <p className="text-[11px] text-slate-500">Active municipal issue coordinates</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold">
            {mapData.markers?.filter(m => m.priority === 'CRITICAL').length || 0}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Critical Hotspots</p>
            <p className="text-[11px] text-slate-500">Requires emergency response</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            {mapData.markers?.filter(m => m.status === 'RESOLVED' || m.status === 'CLOSED').length || 0}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Resolved Locations</p>
            <p className="text-[11px] text-slate-500">Completed infrastructure assets</p>
          </div>
        </div>
      </div>

    </div>
  );
}
