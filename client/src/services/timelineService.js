const API_URL = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, optional = false) {
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!response.ok) {
    if (optional && response.status === 404) return null;
    throw new Error("Unable to load patient timeline. Please try again.");
  }
  return response.json();
}

export async function loadPatientTimeline(patientId) {
  if (!patientId) throw new Error("Patient identity is unavailable. Please sign in again.");
  const [patient, timeline] = await Promise.all([
    request(`/patients/${patientId}`),
    request(`/patients/${patientId}/timeline`),
  ]);
  const insights = await request(`/patients/${patientId}/insights`, true);
  const payload = Array.isArray(timeline) ? { events: timeline } : (timeline || {});
  return {
    patient: normalizePatient(patient || payload.patient),
    events: (payload.events || []).map(normalizeEvent),
    insights: (insights || payload.insights || []).map((insight, index) => ({ ...insight, id: insight.id || insight._id || index })),
    healthTrends: payload.healthTrends || {},
  };
}

function normalizePatient(patient) {
  const user = patient?.userId || {};
  return patient ? {
    name: patient.name || patient.fullName || user.name,
    patientId: patient.patientId || patient.mrdId || patient._id,
    age: patient.age,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    dateOfBirth: patient.dateOfBirth,
    lastVisit: patient.lastVisit,
    primaryCondition: patient.primaryCondition,
    profileImage: patient.profileImage || user.profileImage,
  } : null;
}

function normalizeEvent(event) {
  return {
    ...event,
    id: event.id || event._id,
    type: String(event.type || "update").toLowerCase(),
    summary: event.summary || event.description,
    details: typeof event.details === "object" ? event.details : {},
  };
}

export async function addHealthRecord(patientId, record) {
  const response = await fetch(`${API_URL}/patients/${patientId}/records`, { method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(record) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Unable to save health record.");
  return response.json();
}