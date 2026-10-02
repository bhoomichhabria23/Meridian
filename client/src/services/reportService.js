const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { ...(options.headers || {}) },
  });
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

export async function generateReportSummary(reportId) {
  if (!reportId) throw new Error("This report has no server ID.");
  const response = await request(`/api/reports/${encodeURIComponent(reportId)}/summary`, { method: "POST" });
  return response.json();
}

export async function downloadReport(report) {
  const reportId = report?._id || report?.reportId || report?.id;
  if (!reportId) throw new Error("This report is not available for download yet.");
  const response = await request(`/api/reports/${encodeURIComponent(reportId)}/download`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.fileName || report.name || "clinical-report";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function deleteReport(reportId) {
  if (!reportId) throw new Error("This report cannot be deleted because its server ID is missing.");
  const response = await request(`/api/reports/${encodeURIComponent(reportId)}`, { method: "DELETE" });
  return response.json();
}