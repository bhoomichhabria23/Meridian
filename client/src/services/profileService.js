const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function auth() {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...auth(), "Content-Type": "application/json", ...(options.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Unable to load profile.");
  return response.json();
}

export const fetchProfile = () => request("/api/users/me");
export const updateProfile = (profile) => request("/api/users/me", { method: "PUT", body: JSON.stringify(profile) });
export const changePassword = (currentPassword, newPassword) => request("/api/users/me/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
