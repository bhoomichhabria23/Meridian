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
import axios from "axios";

import { auth } from "../firebase";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [token, setToken] =
    useState(null);

  useEffect(() => {
    // Check for JWT token in localStorage first
    const storedToken =
      localStorage.getItem(
        "token"
      );
    const storedUser = JSON.parse(
      localStorage.getItem(
        "user"
      ) || "null"
    );

    if (
      storedToken &&
      storedUser
    ) {
      setToken(storedToken);
      setUser(storedUser);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${storedToken}`;
      setLoading(false);
      return;
    }

    // Fall back to Firebase auth
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (
            !firebaseUser
          ) {
            localStorage.removeItem(
              "user"
            );
            localStorage.removeItem(
              "role"
            );
            localStorage.removeItem(
              "token"
            );
            localStorage.removeItem(
              "auth_token"
            );
            localStorage.removeItem(
              "patientId"
            );
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
          }

          try {
            const idToken =
              await firebaseUser.getIdToken();
            const storedRole =
              localStorage.getItem(
                "role"
              ) || "patient";

            const nextUser = {
              id: firebaseUser.uid,
              email:
                firebaseUser.email,
              name:
                firebaseUser.displayName ||
                firebaseUser.email,
              role: storedRole,
              firebaseUid:
                firebaseUser.uid,
            };

            setUser(nextUser);
            setToken(idToken);
            localStorage.setItem(
              "user",
              JSON.stringify(
                nextUser
              )
            );
            localStorage.setItem(
              "token",
              idToken
            );
            localStorage.setItem(
              "role",
              storedRole
            );
            axios.defaults.headers.common[
              "Authorization"
            ] =
              `Bearer ${idToken}`;
          } catch (error) {
            console.error(
              "Auth error:",
              error
            );
            setUser(null);
            setToken(null);
          } finally {
            setLoading(false);
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
    localStorage.removeItem(
      "user"
    );
    localStorage.removeItem(
      "token"
    );
    localStorage.removeItem(
      "role"
    );
    localStorage.removeItem(
      "auth_token"
    );
    localStorage.removeItem(
      "patientId"
    );
    delete axios.defaults.headers.common[
      "Authorization"
    ];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }
  return context;
}