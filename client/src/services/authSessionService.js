import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function saveUserProfileToFirebase(firebaseUser, profile = {}) {
  if (!firebaseUser?.uid) return null;

  const role = ["patient", "doctor", "receptionist"].includes(profile.role)
    ? profile.role
    : "patient";

  const profileData = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || profile.email || "",
    name: profile.name || firebaseUser.displayName || "User",
    phone: profile.phone || "",
    role,
    specialization: role === "doctor" ? (profile.specialization || "") : "",
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  await Promise.race([
    setDoc(doc(db, "users", firebaseUser.uid), profileData, { merge: true }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Firestore profile save timed out.")), 8000);
    }),
  ]);

  return profileData;
}

export async function exchangeFirebaseSession(firebaseUser, profile = {}) {
  const idToken = await firebaseUser.getIdToken(true);
  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/firebase-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        role: profile.role || "patient",
        name: profile.name || firebaseUser.displayName || "User",
        phone: profile.phone || "",
        specialization: profile.specialization || "",
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(requestTimeout);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Unable to create Meridian session.");

  try {
    await saveUserProfileToFirebase(firebaseUser, profile);
  } catch (error) {
    console.warn("Firebase profile could not be saved:", error.message);
  }

  localStorage.setItem("token", result.token);
  localStorage.setItem("auth_token", result.token);
  localStorage.setItem("patientId", result.user.id);
  localStorage.setItem("user", JSON.stringify(result.user));
  localStorage.setItem("role", result.user.role);
  return result.user;
}
