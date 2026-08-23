const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function headers() {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Unable to load clinical reports.");
  return response;
}

export async function fetchReports() {
  const response = await request("/api/reports");
  return response.json();
}

export async function fetchPatient(patientId) {
  if (!patientId) return null;
  const response = await request(`/api/patients/${patientId}`);
  return response.json();
}

export async function uploadReport(file, patientId, title = "") {
  const form = new FormData();
  form.append("file", file);
  if (patientId) form.append("patientId", patientId);
  if (title) form.append("title", title);
  const response = await request("/api/reports/upload", { method: "POST", body: form });
  return response.json();
}

export async function downloadReport(report) {
  const response = await request(`/api/reports/${report._id}/download`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.fileName || report.name || "clinical-report";
  link.click();
  URL.revokeObjectURL(url);
}

export async function deleteReport(reportId) {
  const response = await request(`/api/reports/${reportId}`, { method: "DELETE" });
  return response.json();
}