const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

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
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.doctors)) return response.doctors;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.doctors)) return response.data.doctors;
  return [];
}