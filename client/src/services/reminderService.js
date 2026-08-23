const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function auth() {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...auth(), "Content-Type": "application/json", ...(options.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Unable to update reminders.");
  return response.json();
}

export const fetchReminders = () => request("/api/reminders");
export const createReminder = (reminder) => request("/api/reminders", { method: "POST", body: JSON.stringify(reminder) });
export const updateReminder = (id, reminder) => request(`/api/reminders/${id}`, { method: "PUT", body: JSON.stringify(reminder) });
export const deleteReminder = (id) => request(`/api/reminders/${id}`, { method: "DELETE" });
