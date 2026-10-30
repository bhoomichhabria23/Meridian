import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { API_BASE_URL } from "../api/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const verifyServerSession = async (timeoutMs = 1200) => {
    return Promise.race([
      (async () => {
        try {
          const response = await fetch(`${API_BASE_URL || "http://localhost:5000"}/api/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.warn("Server session verification failed:", error.message);
        }

        return null;
      })(),
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  };

  const loadFirestoreUser = async (uid) => {
    try {
      const userDoc = await Promise.race([
        getDoc(doc(db, "users", uid)),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase profile lookup timed out.")), 1500)),
      ]);
      if (userDoc.exists()) {
        return userDoc.data();
      }
    } catch (error) {
      console.warn("Could not load Firebase user profile:", error);
    }

    return null;
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribeFromAuth = null;

    const initAuth = async () => {
      try {
        const serverUser = await verifyServerSession(1200);

        if (serverUser && isMounted) {
          const userData = {
            id: serverUser.id,
            uid: serverUser.uid || serverUser.id,
            email: serverUser.email,
            phone: serverUser.phone || "",
            name: serverUser.name,
            role: serverUser.role || "patient",
            firebaseUid: serverUser.uid || serverUser.id,
            specialization: serverUser.specialization || "",
          };

          setUser(userData);
          setToken(serverUser.token || null);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn("Initial server session check failed:", error);
      }

      if (isMounted) {
        unsubscribeFromAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            if (isMounted) {
              setUser(null);
              setToken(null);
              setLoading(false);
            }
            return;
          }

          try {
            const idToken = await firebaseUser.getIdToken();
            const firestoreUser = await loadFirestoreUser(firebaseUser.uid);
            const nextUser = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              phone: firestoreUser?.phone || "",
              name: firebaseUser.displayName || firestoreUser?.name || firebaseUser.email,
              role: firestoreUser?.role || "patient",
              firebaseUid: firebaseUser.uid,
              specialization: firestoreUser?.specialization || "",
            };

            if (isMounted) {
              setUser(nextUser);
              setToken(idToken);
              setLoading(false);
            }
          } catch (error) {
            console.error("Auth error:", error);
            if (isMounted) {
              setUser(null);
              setToken(null);
              setLoading(false);
            }
          }
        });
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (typeof unsubscribeFromAuth === "function") {
        unsubscribeFromAuth();
      }
    };
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL || "http://localhost:5000"}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.warn("Server logout failed:", error.message);
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}