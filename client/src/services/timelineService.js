const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}${import.meta.env.VITE_API_URL.endsWith("/api") ? "" : "/api"}`
  : "http://localhost:5000/api";

async function request(path, optional = false) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
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
    patient: normalizePatient(patient || payload.patient, payload),
    events: (payload.events || []).map(normalizeEvent),
    recordCounts: payload.recordCounts || {},
    insights: (insights || payload.insights || []).map((insight, index) => ({ ...insight, id: insight.id || insight._id || index })),
    healthTrends: payload.healthTrends || {},
  };
}

function normalizePatient(patient, timeline = {}) {
  const user = patient?.userId || {};
  return patient ? {
    name: patient.name || patient.fullName || user.name,
    patientId: patient.patientCode || patient.patientId || patient.mrdId || patient._id,
    age: patient.age,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    dateOfBirth: patient.dateOfBirth,
    lastVisit: patient.lastVisit || timeline.lastVisit,
    nextAppointment: timeline.nextAppointment,
    primaryCondition: patient.primaryCondition || timeline.primaryCondition || patient.conditions?.[0]?.name || patient.conditions?.[0],
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
  const response = await fetch(`${API_URL}/patients/${patientId}/records`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Unable to save health record.");
  return response.json();
}