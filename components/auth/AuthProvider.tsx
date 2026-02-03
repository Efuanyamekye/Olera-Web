"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AuthState, Account, Profile, Membership, DeferredAction } from "@/lib/types";
import { setDeferredAction } from "@/lib/deferred-action";

export type AuthModalView = "sign-in" | "sign-up";

interface AuthContextValue extends AuthState {
  /** Open the auth modal. Optionally store a deferred action to execute after auth. */
  openAuthModal: (deferred?: Omit<DeferredAction, "createdAt">, view?: AuthModalView) => void;
  /** Close the auth modal. */
  closeAuthModal: () => void;
  /** Whether the auth modal is currently open. */
  isAuthModalOpen: boolean;
  /** The initial view the modal should show when opened. */
  authModalDefaultView: AuthModalView;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
  /** Refresh account/profile/membership data from the database. */
  refreshAccountData: () => Promise<void>;
  /** Switch the active profile to a different one owned by this account. */
  switchProfile: (profileId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    account: null,
    activeProfile: null,
    profiles: [],
    membership: null,
    isLoading: true,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalDefaultView, setAuthModalDefaultView] = useState<AuthModalView>("sign-up");

  const configured = isSupabaseConfigured();

  // Fetch account, all profiles, active profile, and membership for the current user
  const fetchAccountData = useCallback(
    async (userId: string) => {
      if (!configured) return { account: null, activeProfile: null, profiles: [] as Profile[], membership: null };

      const supabase = createClient();

      // Get account
      const { data: account } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .single<Account>();

      if (!account) return { account: null, activeProfile: null, profiles: [] as Profile[], membership: null };

      // Get ALL profiles owned by this account
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_id", account.id)
        .order("created_at", { ascending: true });

      const profiles = (allProfiles as Profile[]) || [];

      // Get active profile (if set)
      let activeProfile: Profile | null = null;
      if (account.active_profile_id) {
        activeProfile = profiles.find((p) => p.id === account.active_profile_id) || null;
      }

      // Get membership (if exists)
      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("account_id", account.id)
        .single<Membership>();

      return { account, activeProfile, profiles, membership };
    },
    [configured]
  );

  // Initialize: check current session
  useEffect(() => {
    if (!configured) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const supabase = createClient();

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { account, activeProfile, profiles, membership } = await fetchAccountData(
          session.user.id
        );
        setState({
          user: { id: session.user.id, email: session.user.email! },
          account,
          activeProfile,
          profiles,
          membership,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    init();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { account, activeProfile, profiles, membership } = await fetchAccountData(
          session.user.id
        );
        setState({
          user: { id: session.user.id, email: session.user.email! },
          account,
          activeProfile,
          profiles,
          membership,
          isLoading: false,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          account: null,
          activeProfile: null,
          profiles: [],
          membership: null,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, fetchAccountData]);

  const openAuthModal = useCallback(
    (deferred?: Omit<DeferredAction, "createdAt">, view?: AuthModalView) => {
      if (deferred) {
        setDeferredAction(deferred);
      }
      setAuthModalDefaultView(view || "sign-up");
      setIsAuthModalOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    if (configured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setState({
      user: null,
      account: null,
      activeProfile: null,
      profiles: [],
      membership: null,
      isLoading: false,
    });
  }, [configured]);

  const refreshAccountData = useCallback(async () => {
    if (!state.user) return;
    const { account, activeProfile, profiles, membership } = await fetchAccountData(
      state.user.id
    );
    setState((prev) => ({ ...prev, account, activeProfile, profiles, membership }));
  }, [state.user, fetchAccountData]);

  const switchProfile = useCallback(
    async (profileId: string) => {
      if (!state.user || !state.account || !configured) return;

      const supabase = createClient();
      const { error } = await supabase
        .from("accounts")
        .update({ active_profile_id: profileId })
        .eq("id", state.account.id);

      if (error) {
        console.error("Failed to switch profile:", error.message);
        return;
      }

      // Update local state immediately then refresh for consistency
      const newActive = state.profiles.find((p) => p.id === profileId) || null;
      setState((prev) => ({
        ...prev,
        account: prev.account ? { ...prev.account, active_profile_id: profileId } : null,
        activeProfile: newActive,
      }));
    },
    [state.user, state.account, state.profiles, configured]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalDefaultView,
        signOut,
        refreshAccountData,
        switchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
