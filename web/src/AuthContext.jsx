// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import API_BASE_URL from "./config/api";

export const PERMISSIONS = {
  admin: {
    dashboard: true,
    cases: true,
    referrals: true,
    communications: true,
    analytics: true,
    evidence: true,
    accountManagement: true,
    systemSettings: true,
    deleteRecords: true,
    exportData: true,
  },
  officer: {
    dashboard: true,
    cases: false,
    referrals: true,
    communications: true,
    analytics: "view",
    evidence: true,
    accountManagement: false,
    systemSettings: true,
    deleteRecords: false,
    exportData: false,
  },
};

const AuthContext = createContext(null);

async function fetchStaffProfileByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  if (!data) return null;
  return { uid: data.id, email: data.email || normalizedEmail, ...data };
}

async function fetchStaffProfileByUid(uid) {
  const normalizedUid = String(uid || "").trim();
  if (!normalizedUid) return null;

  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", normalizedUid)
    .maybeSingle();

  if (!error && data) {
    return { uid: data.id, email: data.email || null, ...data };
  }

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return null;
}

async function resolveStaffByIdentifier(identifier) {
  const clean = String(identifier || "").trim();
  if (!clean) throw new Error("Username or email is required.");

  const resp = await fetch(`${API_BASE_URL}/resolve-staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: clean, email: clean, identifier: clean }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "No user found for that username");
  }

  const json = await resp.json();
  if (!json.email || !String(json.email).includes("@")) {
    throw new Error("No email address found for that username. Contact your administrator.");
  }

  return json;
}

async function resolveStaffProfileForSession(sessionUser) {
  if (!sessionUser) return null;

  const email = String(sessionUser.email || "").trim().toLowerCase();
  const uid = String(sessionUser.id || "").trim();

  const directCandidates = await Promise.all([
    uid ? fetchStaffProfileByUid(uid) : Promise.resolve(null),
    email ? fetchStaffProfileByEmail(email) : Promise.resolve(null),
  ]);

  const directProfile = directCandidates.find(Boolean) || null;
  if (directProfile) {
    return directProfile;
  }

  if (email) {
    try {
      const resp = await fetch(`${API_BASE_URL}/resolve-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username: email, identifier: email }),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.email) {
          return { uid: json.uid || json.profile?.id || sessionUser.id, email: json.email, ...json.profile, ...json };
        }
      }
    } catch (error) {
      console.warn("Background staff resolve fallback failed:", error);
    }
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.warn("Supabase session error:", error);

      if (session?.user) {
        try {
          const profile = await resolveStaffProfileForSession(session.user);
          if (!profile) {
            throw new Error("No user profile found");
          }

          const nextUser = {
            uid: profile.uid || profile.id || session.user.id,
            authUid: session.user.id,
            email: profile.email || session.user.email,
            ...profile,
          };

          if (active) {
            setUser(nextUser);
            sessionStorage.setItem("violess_user", JSON.stringify(nextUser));
          }
        } catch (err) {
          console.warn("Failed to load staff profile from Supabase:", err);
          if (active) {
            setUser(null);
            sessionStorage.removeItem("violess_user");
          }
        }
      } else if (active) {
        setUser(null);
        sessionStorage.removeItem("violess_user");
      }

      if (active) setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        sessionStorage.removeItem("violess_user");
        setLoading(false);
        return;
      }

      try {
        const profile = await resolveStaffProfileForSession(session.user);
        if (!profile) {
          throw new Error("No user profile found");
        }

        const nextUser = {
          uid: profile.uid || profile.id || session.user.id,
          authUid: session.user.id,
          email: profile.email || session.user.email,
          ...profile,
        };

        setUser(nextUser);
        sessionStorage.setItem("violess_user", JSON.stringify(nextUser));
      } catch (err) {
        console.warn("Auth state changed but no matching staff profile was found:", err);
        setUser(null);
        sessionStorage.removeItem("violess_user");
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (identifier, password) => {
    const staff = await resolveStaffByIdentifier(identifier);
    const email = String(staff.email).toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = error.message || "Login failed";
      if (/invalid login|invalid credentials|wrong password|password/i.test(message)) {
        throw new Error("Invalid username or password.");
      }
      throw new Error(message);
    }

    let profile = await resolveStaffProfileForSession(data.user);
    if (!profile) {
      profile = await resolveStaffByIdentifier(email);
    }

    const nextUser = {
      uid: profile?.uid || profile?.id || data.user.id,
      authUid: data.user.id,
      email: profile?.email || data.user.email || email,
      ...profile,
    };

    setUser(nextUser);
    sessionStorage.setItem("violess_user", JSON.stringify(nextUser));
    return nextUser;
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem("violess_user");
  };

  const can = (permission) => {
    if (!user) return false;
    return !!PERMISSIONS[user.role]?.[permission];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout: logoutUser, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};