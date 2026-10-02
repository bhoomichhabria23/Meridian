const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Unable to load profile.");
  return response.json();
}

export const fetchProfile = (token) => request("/api/users/me", {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
export const updateProfile = (profile) => request("/api/users/me", { method: "PUT", body: JSON.stringify(profile) });
export const changePassword = (currentPassword, newPassword) => request("/api/users/me/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
