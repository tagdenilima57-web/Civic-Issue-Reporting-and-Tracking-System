const API_BASE = 'http://127.0.0.1:8000/api';

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('civic_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Server error: ${response.statusText}` };
    }
    const message = errorData.detail || errorData.error || (typeof errorData === 'object' ? Object.values(errorData).flat().join(', ') : 'An unexpected error occurred');
    throw new Error(message);
  }
  return response.json();
}

export const api = {
  // Authentication
  async login(username_or_email, password) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email, password }),
    });
    return handleResponse(res);
  },

  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Metadata
  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : (data.results || []);
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/categories/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : (data.results || []);
  },

  // Complaints
  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        query.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE}/complaints/?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : (data.results || []);
  },

  async getComplaintById(id) {
    const res = await fetch(`${API_BASE}/complaints/${id}/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async trackComplaint(complaintId) {
    const res = await fetch(`${API_BASE}/complaints/track_by_id/?complaint_id=${encodeURIComponent(complaintId)}`);
    return handleResponse(res);
  },

  async createComplaint(formData) {
    const res = await fetch(`${API_BASE}/complaints/`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  async updateStatus(id, newStatus, remarks = '', priority = null) {
    const body = { status: newStatus, remarks };
    if (priority) body.priority = priority;
    const res = await fetch(`${API_BASE}/complaints/${id}/update_status/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async assignComplaint(id, departmentId, officialId = null, notes = '') {
    const res = await fetch(`${API_BASE}/complaints/${id}/assign/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ department_id: departmentId, official_id: officialId, notes }),
    });
    return handleResponse(res);
  },

  async resolveComplaint(id, formData) {
    const res = await fetch(`${API_BASE}/complaints/${id}/resolve/`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  async verifyResolution(id, action, payload = {}) {
    // action: 'CONFIRM' (with rating, comment) or 'REOPEN' (with reason)
    const res = await fetch(`${API_BASE}/complaints/${id}/verify/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, ...payload }),
    });
    return handleResponse(res);
  },

  // AI Services
  async classifyImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await fetch(`${API_BASE}/ai/classify-image/`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  async checkDuplicates(params) {
    const res = await fetch(`${API_BASE}/ai/check-duplicate/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async assessPriority(params) {
    const res = await fetch(`${API_BASE}/ai/assess-priority/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Analytics & GIS
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/analytics/dashboard/`);
    return handleResponse(res);
  },

  async getGISMapData(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'ALL') query.append(k, v);
    });
    const res = await fetch(`${API_BASE}/analytics/gis-map/?${query.toString()}`);
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
