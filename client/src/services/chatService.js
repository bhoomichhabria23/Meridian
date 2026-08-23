const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function sendChatMessage(messages) {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  const response = await fetch(`${API_URL}/api/assistant/chat`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ messages }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    throw new Error(result?.message || "MERIDIAN AI is unavailable right now.");
  }
  return result;
}
