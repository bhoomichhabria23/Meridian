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

import { auth } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "null"
        );
        const storedRole =
          localStorage.getItem("role") ||
          storedUser?.role ||
          "patient";

        if (!firebaseUser) {
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          localStorage.removeItem("token");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("patientId");
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("auth_token") ||
            (await firebaseUser.getIdToken());

          const nextUser = {
            id: storedUser?.id || storedUser?._id,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name:
              firebaseUser.displayName ||
              storedUser?.name ||
              storedUser?.displayName ||
              "User",
            displayName:
              firebaseUser.displayName ||
              storedUser?.displayName ||
              storedUser?.name ||
              "User",
            photoURL: firebaseUser.photoURL || storedUser?.photoURL || "",
            avatar: firebaseUser.photoURL || storedUser?.avatar || "",
            role: storedRole,
            token,
          };

          setUser(nextUser);
          localStorage.setItem("user", JSON.stringify(nextUser));
          localStorage.setItem("role", storedRole);
        } catch (error) {
          console.error(
            "Failed to load Firebase user:",
            error
          );

          const fallbackUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name:
              firebaseUser.displayName ||
              storedUser?.name ||
              storedUser?.displayName ||
              "User",
            displayName:
              firebaseUser.displayName ||
              storedUser?.displayName ||
              storedUser?.name ||
              "User",
            photoURL: firebaseUser.photoURL || storedUser?.photoURL || "",
            avatar: firebaseUser.photoURL || storedUser?.avatar || "",
            role: storedRole,
          };

          setUser(fallbackUser);
          localStorage.setItem("user", JSON.stringify(fallbackUser));
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);

      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");

      setUser(null);

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);