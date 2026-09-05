import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LeafletMap } from '../components/LeafletMap';
import { 
  Camera, Upload, Sparkles, AlertTriangle, MapPin, 
  CheckCircle2, Info, ArrowRight, ShieldCheck, Flame, RefreshCw 
} from 'lucide-react';

export function ReportIssue({ setActivePage, setTrackId, setSelectedComplaintId }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [isSensitiveLocation, setIsSensitiveLocation] = useState(false);
  
  // Location
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locating, setLocating] = useState(false);

  // Media & AI
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiOverridden, setAiOverridden] = useState(false);

  // Duplicate Check
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Priority Preview
  const [priorityEstimate, setPriorityEstimate] = useState(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load categories
  useEffect(() => {
    api.getCategories().then((data) => {
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    }).catch(() => {});
  }, []);

  // Update Priority whenever factors change
  useEffect(() => {
    if (!selectedCategory) return;
    api.assessPriority({
      category_id: selectedCategory,
      severity: severity,
      is_sensitive_location: isSensitiveLocation
    }).then(setPriorityEstimate).catch(() => {});
  }, [selectedCategory, severity, isSensitiveLocation]);

  // Handle GPS location detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setLocation(coords);
        setLocating(false);
        // Reverse geocoding lookup approximation
        setAddress(`Near Lat: ${coords.lat}, Lng: ${coords.lng}, Ward Zone`);
        checkNearbyDuplicates(coords.lat, coords.lng, selectedCategory, title, description);
      },
      (err) => {
        setLocating(false);
        alert('Could not retrieve GPS location. You can click anywhere on the map to pinpoint.');
      }
    );
  };

  const handleMapLocationPick = (coords) => {
    setLocation(coords);
    if (!address) {
      setAddress(`Pin at Lat: ${coords.lat}, Lng: ${coords.lng}`);
    }
    checkNearbyDuplicates(coords.lat, coords.lng, selectedCategory, title, description);
  };

  // Duplicate Detection Trigger
  const checkNearbyDuplicates = async (lat, lng, catId, t, d) => {
    if (!lat || !lng) return;
    try {
      setCheckingDuplicates(true);
      const res = await api.checkDuplicates({
        latitude: lat,
        longitude: lng,
        category_id: catId,
        title: t,
        description: d
      });
      setDuplicateMatches(res.duplicates || []);
    } catch {
      // ignore
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Handle Image Upload & AI Classification Trigger
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));

    // Run AI Visual Classification
    setAnalyzingImage(true);
    setAiSuggestion(null);
    try {
      const result = await api.classifyImage(file);
      setAiSuggestion(result);
      if (result.category_id) {
        // Automatically select the suggested category initially
        setSelectedCategory(result.category_id);
        setAiOverridden(false);
      }
    } catch (err) {
      console.warn('AI classification error:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleManualCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (aiSuggestion && aiSuggestion.category_id !== parseInt(catId)) {
      setAiOverridden(true);
    }
    checkNearbyDuplicates(location.lat, location.lng, catId, title, description);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed problem description.');
      return;
    }
    if (!selectedCategory) {
      setError('Please select an issue category.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category_id', selectedCategory);
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);
      formData.append('address', address.trim());
      formData.append('landmark', landmark.trim());
      formData.append('severity', severity);
      formData.append('is_sensitive_location', isSensitiveLocation);

      if (aiSuggestion) {
        formData.append('ai_category_id', aiSuggestion.category_id || '');
        formData.append('ai_confidence', aiSuggestion.confidence || 0.8);
      }

      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      const created = await api.createComplaint(formData);
      setTrackId(created.complaint_id);
      setSelectedComplaintId(created.id);
      setActivePage('complaint-detail');
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-blue-700 font-bold mb-1">
          <AlertTriangle className="w-6 h-6 text-blue-700" />
          <h1 className="text-xl sm:text-2xl text-slate-900 font-black">Report a Civic Problem</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Connect directly with municipal engineers. Your complaint will receive an official Tracking ID, GPS coordinates, and departmental routing.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Evidence & AI Classification */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                Upload Photo Evidence & AI Classification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload a photo to let the municipal AI classify the problem and suggest the correct department.</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              AI Assisted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition cursor-pointer bg-slate-50/50 relative">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              {mediaPreview ? (
                <div className="space-y-2">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-cover shadow-sm"
                  />
                  <p className="text-xs text-blue-700 font-semibold">Click to replace photo</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Click or drop issue photo here</p>
                  <p className="text-[11px] text-slate-400">JPEG, PNG, WebP up to 15MB</p>
                </div>
              )}
            </div>

            {/* AI Classification Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Issue Classifier
                </span>
                {analyzingImage && (
                  <span className="text-blue-600 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Analyzing visual features...
                  </span>
                )}
              </div>

              {aiSuggestion ? (
                <div className="space-y-2.5 bg-white p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">AI Suggested Category:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                      {aiSuggestion.category_name} ({aiSuggestion.confidence_percent}% Match)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Routing Department:</span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {aiSuggestion.suggested_department_name}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                    "{aiSuggestion.explanation}"
                  </p>

                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 leading-tight">
                    <strong>AI Transparency Notice:</strong> {aiSuggestion.disclaimer}
                    {aiOverridden && (
                      <div className="mt-1 font-semibold text-blue-800">
                        &bull; You have manually selected a different category. Your manual selection takes full precedence!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-[11px] leading-relaxed py-2">
                  Upload an image of the pothole, waste pile, or streetlight. The system will analyze visual features like asphalt textures, color entropy, or vertical fixtures to suggest the category.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Problem Description & Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
            Grievance Details
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deep pothole damaging vehicles outside Main Metro Gate"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                checkNearbyDuplicates(location.lat, location.lng, selectedCategory, e.target.value, description);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category (Verified or Manual Selection) <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleManualCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium text-slate-800"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} &mdash; {c.department_name} (SLA: {c.sla_hours}h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the severity, physical dimensions, hazard to pedestrians or traffic, and how long the problem has persisted..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                checkNearbyDuplicates(location.lat, location.lng, selectedCategory, title, e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Severity & Sensitive Location for Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hazard Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
              >
                <option value="CRITICAL">Critical Danger (Immediate threat to life/traffic)</option>
                <option value="HIGH">High Severity (Major damage / severe blockage)</option>
                <option value="MODERATE">Moderate Severity (Standard nuisance/hazard)</option>
                <option value="LOW">Low Severity (Aesthetic / minor problem)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSensitiveLocation}
                  onChange={(e) => setIsSensitiveLocation(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs text-slate-700">
                  Located near School, Hospital, or Major Arterial Road (+Priority)
                </span>
              </label>
            </div>
          </div>

          {/* Priority Estimation Card */}
          {priorityEstimate && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${priorityEstimate.priority === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`} />
                <span className="text-slate-700">
                  Estimated Municipal Priority: <strong>{priorityEstimate.priority}</strong> (Score: {priorityEstimate.priority_score}/100)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 italic hidden sm:inline">
                Formula: Base ({priorityEstimate.factors?.base_category_score}) + Hazard ({priorityEstimate.factors?.user_reported_severity}) + Zone ({priorityEstimate.factors?.location_sensitivity})
              </span>
            </div>
          )}
        </div>

        {/* Step 3: Geographical GPS Location & Map */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                Geographical Location & GIS Pin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Pinpoint exact coordinates for field inspection teams.</p>
            </div>

            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={locating}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <MapPin className="w-3.5 h-3.5" />
              {locating ? 'Acquiring GPS...' : '📍 Use My GPS Location'}
            </button>
          </div>

          {/* Map Embed */}
          <div className="h-64 sm:h-72">
            <LeafletMap
              center={[location.lat, location.lng]}
              zoom={14}
              isPicker={true}
              pickedLocation={location}
              onLocationPick={handleMapLocationPick}
              height="100%"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / Area Name
              </label>
              <input
                type="text"
                placeholder="e.g. 5th Main Road, Near Metro Gate"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nearby Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Opposite Post Office"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Selected Coordinates: Lat {location.lat}, Lng {location.lng}
          </p>
        </div>

        {/* Duplicate Warning Mechanism */}
        {duplicateMatches.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-xs space-y-2 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Possible Duplicate Complaint Detected ({duplicateMatches.length} nearby)</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Our spatial-textual duplicate engine detected active reports near this location. In accordance with civic policy, you may review these matches or continue submitting if this is a distinct issue.
            </p>
            <div className="space-y-1.5 pt-1">
              {duplicateMatches.slice(0, 2).map((dup) => (
                <div key={dup.id} className="bg-white p-2.5 rounded-lg border border-amber-200 flex justify-between items-center text-slate-800">
                  <div>
                    <span className="font-mono font-bold text-blue-700">{dup.complaint_id}:</span>{' '}
                    <span className="font-semibold">{dup.title}</span>
                    <span className="text-[11px] text-slate-500 block">
                      📍 {dup.distance_meters}m away &bull; Category: {dup.category_name} &bull; Match Score: {(dup.combined_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setTrackId(dup.complaint_id); setSelectedComplaintId(dup.id); setActivePage('complaint-detail'); }}
                    className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 ml-2"
                  >
                    View Existing &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Submit */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setActivePage('citizen-dashboard')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Submitting Grievance...' : 'Submit Complaint & Generate Tracking ID'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
}
