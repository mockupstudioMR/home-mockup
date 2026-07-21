import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "designer" | "furniture_shop" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  roleLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  acceptInvite: (token: string) => Promise<{ success: boolean; error?: string }>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    setRoleLoading(true);
    const maxAttempts = 3;
    let attempt = 0;
    let delayMs = 600;
    let lastError: unknown = null;

    try {
      while (attempt < maxAttempts) {
        attempt += 1;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const { data, error } = await supabase
            .rpc("get_user_role", { _user_id: userId })
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);

          if (error) throw error;

          setRole((data as AppRole) || "user");
          return;
        } catch (err) {
          clearTimeout(timeoutId);
          lastError = err;

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs *= 2;
          }
        }
      }

      console.error("Error fetching role:", lastError);
      setRole("user");
    } finally {
      setRoleLoading(false);
    }
  };

  const refreshRole = async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  };

  useEffect(() => {
    let initialSessionHandled = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          // Skip if getSession already handled this
          if (!initialSessionHandled) {
            initialSessionHandled = true;
            setTimeout(() => fetchUserRole(session.user.id), 0);
          }
        } else {
          // Reset flag so next login triggers role fetch
          initialSessionHandled = false;
          setRole(null);
          setRoleLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user && !initialSessionHandled) {
        initialSessionHandled = true;
        fetchUserRole(session.user.id);
      } else if (!session?.user) {
        setRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const maxAttempts = 3;
    let delayMs = 600;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return { error: null };
        // Auth errors (invalid creds, etc.) shouldn't be retried
        const msg = error.message || "";
        const isNetwork = /load failed|failed to fetch|network|timeout/i.test(msg);
        if (!isNetwork) return { error };
        lastError = error;
      } catch (err) {
        lastError = err as Error;
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2;
      }
    }
    return {
      error: new Error(
        "Can't reach the server right now. Check your connection and try again."
      ),
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  const acceptInvite = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc("accept_invite", {
        invite_token: token,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        await refreshRole();
        return { success: true };
      }

      return { success: false, error: "Invalid or expired invite token" };
    } catch (err) {
      return { success: false, error: "Failed to accept invite" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        roleLoading,
        signUp,
        signIn,
        signOut,
        acceptInvite,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
