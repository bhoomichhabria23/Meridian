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
  const events = (payload.events || []).map(normalizeEvent);
  const healthTrends = {};
  Object.entries(payload.healthTrends || {}).forEach(([key, values]) => {
    const metric = normalizeMetric(key);
    if (!metric || !Array.isArray(values)) return;
    healthTrends[metric] = [
      ...(healthTrends[metric] || []),
      ...values
        .map((item) => normalizeTrendValue(item))
        .filter(Boolean),
    ];
  });
  events.forEach((event) => {
    const metric = normalizeMetric(event.details?.metric || event.title || event.description);
    const value = numericValue(event.details?.value);
    const date = new Date(event.date);
    if (!metric || !Number.isFinite(value) || Number.isNaN(date.getTime())) return;
    const values = healthTrends[metric] || [];
    if (!values.some((item) => String(item.date || item.label) === String(event.date) && item.value === value)) {
      values.push({
        label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        value,
        unit: event.details?.unit || "",
        date: event.date,
      });
    }
    healthTrends[metric] = values.sort((first, second) => new Date(first.date || 0) - new Date(second.date || 0));
  });
  return {
    patient: normalizePatient(patient || payload.patient, payload),
    events,
    recordCounts: payload.recordCounts || {},
    insights: (insights || payload.insights || []).map((insight, index) => ({ ...insight, id: insight.id || insight._id || index })),
    healthTrends,
  };
}

function normalizeMetric(value) {
  const metric = String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (metric.includes("bloodpressure") || metric === "bp" || metric.includes("systolic")) return "bloodPressure";
  if (metric.includes("heartrate") || metric.includes("pulse")) return "heartRate";
  if (metric.includes("hba1c") || metric.includes("hemoglobina1c") || metric.includes("glucose") || metric.includes("bloodsugar") || metric === "fbs") return "glucose";
  if (metric.includes("weight")) return "weight";
  return null;
}

function numericValue(value) {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function normalizeTrendValue(item) {
  const value = numericValue(item?.value);
  if (!Number.isFinite(value)) return null;
  const date = item?.date ? new Date(item.date) : null;
  return {
    ...item,
    value,
    date: date && !Number.isNaN(date.getTime()) ? item.date : item?.label,
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