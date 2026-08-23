const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function headers() {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Unable to load appointments.");
  return response.json();
}

export async function fetchAppointments(patientId) {
  if (!patientId) throw new Error("Patient identity is unavailable.");
  return request(`/api/patients/${patientId}/appointments`);
}

export async function createAppointment(payload) {
  return request("/api/appointments", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateAppointment(id, payload) {
  return request(`/api/appointments/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function cancelAppointment(id) {
  return request(`/api/appointments/${id}`, { method: "DELETE" });
}

export async function fetchDoctors() {
  const response = await request("/api/doctors");
  return Array.isArray(response) ? response : response.doctors || [];
}