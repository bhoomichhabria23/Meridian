import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import { API_BASE_URL } from "../api/config";

const API_URL = API_BASE_URL || "http://localhost:5000";

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
  let storedProfile = null;
  if ((!profile.phone || !profile.specialization) && firebaseUser.uid) {
    try {
      const profileSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
      storedProfile = profileSnapshot.exists() ? profileSnapshot.data() : null;
    } catch (error) {
      console.warn("Firebase profile could not be loaded:", error.message);
    }
  }
  const sessionProfile = {
    ...profile,
    phone: profile.phone || storedProfile?.phone || "",
    specialization: profile.specialization || storedProfile?.specialization || "",
  };
  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/firebase-session`, {
      method: "POST",
      credentials: "include", // Include cookies in request and save response cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        role: sessionProfile.role || "patient",
        name: sessionProfile.name || firebaseUser.displayName || "User",
        phone: sessionProfile.phone,
        specialization: sessionProfile.specialization || "",
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(requestTimeout);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Unable to create Meridian session.");

  try {
    await saveUserProfileToFirebase(firebaseUser, {
      ...sessionProfile,
      specialization: sessionProfile.specialization || result.user?.specialization || "",
    });
  } catch (error) {
    console.warn("Firebase profile could not be saved:", error.message);
  }

  return { ...result.user, token: result.token };
}
