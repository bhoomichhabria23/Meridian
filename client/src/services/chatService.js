const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function sendChatMessage(messages) {
  const message = messages.filter((item) => item.role === "user").at(-1)?.content || "";
  const response = await fetch(`${API_URL}/api/assistant/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || "MERIDIAN AI is unavailable right now.");
  }
  return result.data || result;
}

export async function fetchChatHistory(patientId = "") {
  const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
  const response = await fetch(`${API_URL}/api/assistant/history${query}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || "Unable to load chat history.");
  return result.data?.messages || [];
}
