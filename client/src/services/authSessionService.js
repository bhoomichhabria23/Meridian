const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function exchangeFirebaseSession(firebaseUser, profile = {}) {
  const idToken = await firebaseUser.getIdToken(true);
  const response = await fetch(`${API_URL}/api/auth/firebase-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      role: profile.role || "patient",
      name: profile.name || firebaseUser.displayName || "User",
      phone: profile.phone || "",
      specialization: profile.specialization || "",
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Unable to create Meridian session.");
  localStorage.setItem("token", result.token);
  localStorage.setItem("auth_token", result.token);
  localStorage.setItem("patientId", result.user.id);
  localStorage.setItem("user", JSON.stringify(result.user));
  localStorage.setItem("role", result.user.role);
  return result.user;
}
