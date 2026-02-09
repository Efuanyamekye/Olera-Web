"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile, ProfileCategory } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/auth/OtpInput";

// ============================================================
// Types
// ============================================================

/** User intent: looking for care (family) or providing care (provider) */
export type UserIntent = "family" | "provider";

/** Provider subtype */
export type ProviderType = "organization" | "caregiver";

/**
 * Flow steps in order (onboarding first, then auth):
 *
 * Provider path:
 *   intent? → provider-type → provider-info → org-search? → visibility → auth → verify-code? → complete
 *
 * Family path:
 *   intent? → family-info → family-needs → auth → verify-code? → complete
 *
 * If user is already authenticated, auth/verify-code steps are skipped.
 */
export type AuthFlowStep =
  // Onboarding steps (FIRST)
  | "intent"         // Family vs Provider selection (skipped if intent preset)
  | "provider-type"  // Organization vs Caregiver
  | "provider-info"  // Name, location, care types
  | "org-search"     // Search/claim existing organization (org only)
  | "visibility"     // Who can see the profile
  | "family-info"    // Care recipient details
  | "family-needs"   // Care needs and preferences
  // Auth steps (LAST - skipped if already authenticated)
  | "auth"           // Email, password entry
  | "verify-code";   // OTP verification

/** Props for AuthFlowModal */
export interface AuthFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-set intent to skip the intent question. null = ask user */
  intent?: UserIntent | null;
  /** Pre-set provider type to skip that question (provider path only) */
  providerType?: ProviderType | null;
  /** Profile to claim (for claim flow) */
  claimProfile?: Profile | null;
  /** Default to sign-in instead of sign-up */
  defaultToSignIn?: boolean;
}

/** Collected data throughout the flow */
interface FlowData {
  // Auth data
  email: string;
  password: string;
  displayName: string;
  // Intent
  intent: UserIntent | null;
  // Provider data
  providerType: ProviderType | null;
  orgName: string;
  city: string;
  state: string;
  zip: string;
  careTypes: string[];
  category: ProfileCategory | null;
  description: string;
  phone: string;
  visibleToFamilies: boolean;
  visibleToProviders: boolean;
  // Claim data
  claimedProfileId: string | null;
  claimedProfile: Profile | null;
  // Family data
  careRecipientName: string;
  careRecipientRelation: string;
  careNeeds: string[];
}

const INITIAL_DATA: FlowData = {
  email: "",
  password: "",
  displayName: "",
  intent: null,
  providerType: null,
  orgName: "",
  city: "",
  state: "",
  zip: "",
  careTypes: [],
  category: null,
  description: "",
  phone: "",
  visibleToFamilies: true,
  visibleToProviders: true,
  claimedProfileId: null,
  claimedProfile: null,
  careRecipientName: "",
  careRecipientRelation: "",
  careNeeds: [],
};

// ============================================================
// Constants
// ============================================================

const ORG_CATEGORIES: { value: ProfileCategory; label: string }[] = [
  { value: "assisted_living", label: "Assisted Living" },
  { value: "independent_living", label: "Independent Living" },
  { value: "memory_care", label: "Memory Care" },
  { value: "nursing_home", label: "Nursing Home / Skilled Nursing" },
  { value: "home_care_agency", label: "Home Care Agency" },
  { value: "home_health_agency", label: "Home Health Agency" },
  { value: "hospice_agency", label: "Hospice" },
  { value: "rehab_facility", label: "Rehabilitation Facility" },
  { value: "adult_day_care", label: "Adult Day Care" },
  { value: "wellness_center", label: "Wellness Center" },
];

const CARE_TYPES = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
  "Respite Care",
  "Adult Day Care",
  "Rehabilitation",
];

const STORAGE_KEY = "olera_onboarding_progress";

// ============================================================
// Step Configuration
// ============================================================

interface StepConfig {
  title: string;
  stepNumber: number;
  totalSteps: number;
}

function getStepConfig(step: AuthFlowStep, data: FlowData, isAuthenticated: boolean): StepConfig {
  // Calculate total steps based on path
  const isProvider = data.intent === "provider";
  const isOrg = data.providerType === "organization";

  // Provider path: type(1) → info(2) → search?(3) → auth(3/4)
  // Family path: info(1) → needs(2) → auth(3)

  let totalSteps: number;
  let stepNumber: number;

  if (isProvider) {
    // Provider steps: type, info, search(org only), auth(if needed)
    totalSteps = isOrg ? 3 : 2;
    if (!isAuthenticated) totalSteps += 1; // Add auth step

    const stepMap: Record<string, number> = {
      "intent": 0, // Not counted if skipped
      "provider-type": 1,
      "provider-info": 2,
      "org-search": 3,
      "visibility": isOrg ? 3 : 2, // kept for type safety, not used
      "auth": isOrg ? 4 : 3,
      "verify-code": isOrg ? 4 : 3, // Same as auth
    };
    stepNumber = stepMap[step] || 1;
  } else {
    // Family steps: info, needs, auth(if needed)
    totalSteps = isAuthenticated ? 2 : 3;

    const stepMap: Record<string, number> = {
      "intent": 0,
      "family-info": 1,
      "family-needs": 2,
      "auth": 3,
      "verify-code": 3,
    };
    stepNumber = stepMap[step] || 1;
  }

  const titles: Record<AuthFlowStep, string> = {
    "intent": "Welcome to Olera",
    "provider-type": "Tell us about yourself",
    "provider-info": data.providerType === "organization" ? "About your organization" : "About you",
    "org-search": "Is your organization listed?",
    "visibility": "Who can find you?", // kept for type safety
    "family-info": "Who needs care?",
    "family-needs": "Care preferences",
    "auth": "Create your account",
    "verify-code": "Verify your email",
  };

  return {
    title: titles[step],
    stepNumber,
    totalSteps,
  };
}

// ============================================================
// Component
// ============================================================

export default function AuthFlowModal({
  isOpen,
  onClose,
  intent: initialIntent = null,
  providerType: initialProviderType = null,
  claimProfile = null,
  defaultToSignIn = false,
}: AuthFlowModalProps) {
  const router = useRouter();
  const { user, account, refreshAccountData } = useAuth();

  // Determine starting step based on context
  const getInitialStep = useCallback((): AuthFlowStep => {
    // Claim flow: skip directly to auth since we have the profile data
    if (claimProfile) {
      return "auth";
    }
    if (initialIntent === "provider") {
      return initialProviderType ? "provider-info" : "provider-type";
    }
    if (initialIntent === "family") {
      return "family-info";
    }
    return "intent";
  }, [initialIntent, initialProviderType, claimProfile]);

  // Core state
  const [step, setStep] = useState<AuthFlowStep>(getInitialStep());
  const [data, setData] = useState<FlowData>(() => {
    // Pre-populate data from claim profile if provided
    if (claimProfile) {
      return {
        ...INITIAL_DATA,
        intent: "provider" as const,
        providerType: "organization" as const,
        orgName: claimProfile.display_name || "",
        city: claimProfile.city || "",
        state: claimProfile.state || "",
        zip: claimProfile.zip || "",
        careTypes: claimProfile.care_types || [],
        category: claimProfile.category,
        description: claimProfile.description || "",
        phone: claimProfile.phone || "",
        claimedProfileId: claimProfile.id,
        claimedProfile: claimProfile,
      };
    }
    return {
      ...INITIAL_DATA,
      intent: initialIntent,
      providerType: initialProviderType,
      claimedProfileId: null,
      claimedProfile: null,
    };
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth-specific state
  const [authMode, setAuthMode] = useState<"sign-up" | "sign-in">(
    defaultToSignIn ? "sign-in" : "sign-up"
  );
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Org search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // localStorage Persistence
  // ──────────────────────────────────────────────────────────

  // Save progress to localStorage when data changes
  useEffect(() => {
    if (isOpen && step !== "auth" && step !== "verify-code") {
      try {
        const toSave = {
          step,
          data: {
            intent: data.intent,
            providerType: data.providerType,
            orgName: data.orgName,
            displayName: data.displayName,
            city: data.city,
            state: data.state,
            zip: data.zip,
            careTypes: data.careTypes,
            category: data.category,
            description: data.description,
            phone: data.phone,
            visibleToFamilies: data.visibleToFamilies,
            visibleToProviders: data.visibleToProviders,
            careRecipientName: data.careRecipientName,
            careRecipientRelation: data.careRecipientRelation,
            careNeeds: data.careNeeds,
            // Don't save sensitive auth data or claim data
          },
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        // localStorage unavailable
      }
    }
  }, [isOpen, step, data]);

  // Restore progress from localStorage on open (but not for claim flows)
  useEffect(() => {
    // Don't restore saved progress for claim flows - they have specific profile data
    if (isOpen && !claimProfile) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only restore if less than 30 minutes old
          if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
            // Only restore if intent matches (or no intent was preset)
            if (!initialIntent || parsed.data.intent === initialIntent) {
              setData((prev) => ({ ...prev, ...parsed.data }));
              // Don't restore step - let user start fresh but with their data
            }
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, [isOpen, initialIntent, claimProfile]);

  // ──────────────────────────────────────────────────────────
  // Reset and Initialization
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes (but keep localStorage for resume)
      setStep(getInitialStep());
      // Reset data, pre-populating from claim profile if provided
      if (claimProfile) {
        setData({
          ...INITIAL_DATA,
          intent: "provider" as const,
          providerType: "organization" as const,
          orgName: claimProfile.display_name || "",
          city: claimProfile.city || "",
          state: claimProfile.state || "",
          zip: claimProfile.zip || "",
          careTypes: claimProfile.care_types || [],
          category: claimProfile.category,
          description: claimProfile.description || "",
          phone: claimProfile.phone || "",
          claimedProfileId: claimProfile.id,
          claimedProfile: claimProfile,
        });
      } else {
        setData({
          ...INITIAL_DATA,
          intent: initialIntent,
          providerType: initialProviderType,
          claimedProfileId: null,
          claimedProfile: null,
        });
      }
      setError("");
      setLoading(false);
      setAuthMode(defaultToSignIn ? "sign-in" : "sign-up");
      setOtpCode("");
      setResendCooldown(0);
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
      setHasSearched(false);
      setSelectedOrgId(null);
    }
  }, [isOpen, initialIntent, initialProviderType, claimProfile, defaultToSignIn, getInitialStep]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-complete claim flows when user is already authenticated
  const claimAutoCompleteRef = useRef(false);
  useEffect(() => {
    if (isOpen && claimProfile && user && !claimAutoCompleteRef.current) {
      claimAutoCompleteRef.current = true;
      handleComplete();
    }
    if (!isOpen) {
      claimAutoCompleteRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, claimProfile, user]);

  // ──────────────────────────────────────────────────────────
  // Data Update Helper
  // ──────────────────────────────────────────────────────────

  const updateData = useCallback((partial: Partial<FlowData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  // ──────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────

  const goBack = () => {
    setError("");

    switch (step) {
      case "provider-type":
        if (initialIntent === null) {
          setStep("intent");
        }
        break;
      case "provider-info":
        if (initialProviderType) {
          // Can't go back if provider type was preset
        } else {
          setStep("provider-type");
        }
        break;
      case "org-search":
        setStep("provider-info");
        break;
      case "family-info":
        if (initialIntent === null) {
          setStep("intent");
        }
        break;
      case "family-needs":
        setStep("family-info");
        break;
      case "auth":
        if (claimProfile) {
          // Claim flow starts at auth - can't go back
        } else if (data.intent === "provider") {
          if (data.providerType === "organization") {
            setStep("org-search");
          } else {
            setStep("provider-info");
          }
        } else {
          setStep("family-needs");
        }
        break;
      case "verify-code":
        setStep("auth");
        setOtpCode("");
        break;
    }
  };

  const canGoBack = (): boolean => {
    // First step of the flow (based on context) can't go back
    if (step === "intent") return false;
    if (step === "provider-type" && initialIntent === "provider") return false;
    if (step === "provider-info" && initialProviderType) return false;
    if (step === "family-info" && initialIntent === "family") return false;
    // Claim flow starts at auth - can't go back
    if (step === "auth" && claimProfile) return false;
    return true;
  };

  // ──────────────────────────────────────────────────────────
  // Intent Selection
  // ──────────────────────────────────────────────────────────

  const handleIntentSelect = (intent: UserIntent) => {
    updateData({ intent });
    if (intent === "provider") {
      setStep("provider-type");
    } else {
      setStep("family-info");
    }
  };

  // ──────────────────────────────────────────────────────────
  // Provider Path Handlers
  // ──────────────────────────────────────────────────────────

  const handleProviderTypeSelect = (type: ProviderType) => {
    updateData({ providerType: type });
    setStep("provider-info");
  };

  const handleProviderInfoNext = () => {
    if (data.providerType === "organization") {
      setSearchQuery(data.orgName);
      setStep("org-search");
    } else if (user) {
      // Already authenticated — skip to profile creation
      handleComplete();
    } else {
      setStep("auth");
    }
  };

  const isProviderInfoValid = (): boolean => {
    const name = data.providerType === "organization" ? data.orgName : data.displayName;
    return (
      name.trim().length > 0 &&
      (data.city.trim().length > 0 || data.state.trim().length > 0) &&
      data.careTypes.length > 0 &&
      data.phone.trim().length > 0
    );
  };

  // Org search
  const searchOrgs = useCallback(async (query: string) => {
    if (!query.trim() || !isSupabaseConfigured()) return;
    setSearching(true);

    try {
      const supabase = createClient();
      let searchQuery = supabase
        .from("business_profiles")
        .select("*")
        .eq("type", "organization")
        .eq("claim_state", "unclaimed")
        .ilike("display_name", `%${query.trim()}%`);

      // Filter by state if provided to reduce noise
      if (data.state?.trim()) {
        searchQuery = searchQuery.ilike("state", data.state.trim());
      }

      const { data: profiles, error: searchErr } = await searchQuery.limit(10);

      if (searchErr) {
        setSearchResults([]);
      } else {
        setSearchResults((profiles as Profile[]) || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setHasSearched(true);
      setSearching(false);
    }
  }, [data.state]);

  // Auto-search when entering org-search step
  useEffect(() => {
    if (step === "org-search" && data.orgName && !hasSearched) {
      searchOrgs(data.orgName);
    }
  }, [step, data.orgName, hasSearched, searchOrgs]);

  const handleOrgSearchNext = () => {
    if (selectedOrgId) {
      const profile = searchResults.find((p) => p.id === selectedOrgId);
      if (profile) {
        updateData({
          claimedProfileId: selectedOrgId,
          claimedProfile: profile,
        });
      }
    }
    if (user) {
      // Already authenticated — skip to profile creation
      handleComplete();
    } else {
      setStep("auth");
    }
  };

  // ──────────────────────────────────────────────────────────
  // Family Path Handlers
  // ──────────────────────────────────────────────────────────

  const handleFamilyInfoNext = () => {
    setStep("family-needs");
  };

  const handleFamilyNeedsNext = () => {
    if (user) {
      // Already authenticated - skip to profile creation
      handleComplete();
    } else {
      // Need to authenticate first
      setStep("auth");
    }
  };

  // ──────────────────────────────────────────────────────────
  // Auth Handlers
  // ──────────────────────────────────────────────────────────

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (data.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const displayNameForAuth = data.displayName || data.orgName || "";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { display_name: displayNameForAuth || undefined },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("This email is already registered. Try signing in instead.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (!authData.session) {
        if (authData.user?.identities?.length === 0) {
          setError("This email is already registered. Try signing in instead.");
          setLoading(false);
          return;
        }

        // Email confirmation required - send an explicit OTP code
        // signUp sends a magic link by default, but we want an OTP code
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: {
            shouldCreateUser: false, // User already exists from signUp
          },
        });

        if (otpError) {
          console.error("Failed to send OTP:", otpError);
          // Fall back to showing verify screen anyway - user can resend
        }

        setResendCooldown(30);
        setLoading(false);
        setStep("verify-code");
        return;
      }

      // No email confirmation needed - proceed to profile creation
      setLoading(false);
      await handleComplete();
    } catch (err) {
      console.error("Sign up error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Wrong email or password. Please try again."
            : authError.message
        );
        setLoading(false);
        return;
      }

      // Signed in - proceed to profile creation
      setLoading(false);
      await handleComplete();
    } catch (err) {
      console.error("Sign in error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otpCode.length !== 8) {
      setError("Please enter the 8-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: otpCode,
        type: "email", // Use "email" for OTP sent via signInWithOtp
      });

      if (verifyError) {
        if (verifyError.message.includes("expired")) {
          setError("This code has expired. Please request a new one.");
        } else if (verifyError.message.includes("invalid")) {
          setError("Invalid code. Please check and try again.");
        } else {
          setError(verifyError.message);
        }
        setLoading(false);
        return;
      }

      // OTP verified - complete the flow by creating account and profile
      // This is the final step; handleComplete will persist all data and redirect
      await handleComplete();
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      // Use signInWithOtp to send an OTP code
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false, // User already exists from signUp
        },
      });

      if (resendError) {
        setError(resendError.message);
        setLoading(false);
        return;
      }

      setResendCooldown(60);
      setOtpCode("");
      setLoading(false);
    } catch (err) {
      console.error("Resend code error:", err);
      setError("Failed to resend code. Please try again.");
      setLoading(false);
    }
  };

  // Send OTP code for sign-in (alternative to password)
  const handleSendOtpForSignIn = async () => {
    if (!data.email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false, // Only existing users can use this
        },
      });

      if (otpError) {
        if (otpError.message.includes("not found") || otpError.message.includes("not registered")) {
          setError("No account found with this email. Please sign up first.");
        } else {
          setError(otpError.message);
        }
        setLoading(false);
        return;
      }

      setResendCooldown(30);
      setLoading(false);
      setStep("verify-code");
    } catch (err) {
      console.error("Send OTP error:", err);
      setError("Failed to send code. Please try again.");
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Profile Creation (Final Step)
  // ──────────────────────────────────────────────────────────

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      if (!isSupabaseConfigured()) {
        setError("Backend not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError("Not authenticated. Please try again.");
        setLoading(false);
        return;
      }

      // Ensure account exists via server-side API (bypasses RLS)
      let accountRow = account;
      if (!accountRow) {
        const displayName = data.displayName || data.orgName || currentUser.email?.split("@")[0] || "";
        const response = await fetch("/api/auth/ensure-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: displayName }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to set up account");
        }

        const { account: newAccount } = await response.json();
        accountRow = newAccount;
      }

      if (!accountRow) {
        setError("Account setup failed. Please try again.");
        setLoading(false);
        return;
      }

      // Create profile based on intent
      let profileId: string;

      if (data.intent === "provider") {
        profileId = await createProviderProfile(supabase, accountRow.id);
      } else if (data.intent === "family") {
        profileId = await createFamilyProfile(supabase, accountRow.id);
      } else {
        // No intent set — cannot create a profile without explicit user intent
        setError("Please select whether you're looking for care or providing care.");
        setLoading(false);
        return;
      }

      // Update account
      const displayName = data.displayName || data.orgName;
      const { error: accountErr } = await supabase
        .from("accounts")
        .update({
          onboarding_completed: true,
          active_profile_id: profileId,
          display_name: accountRow.display_name || displayName,
        })
        .eq("id", accountRow.id);
      if (accountErr) throw accountErr;

      // Create membership for providers
      if (data.intent === "provider") {
        await supabase.from("memberships").upsert(
          { account_id: accountRow.id, plan: "free", status: "free" },
          { onConflict: "account_id" }
        );
      }

      // Clear saved progress
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }

      // Refresh auth state and redirect to appropriate dashboard
      await refreshAccountData();
      onClose();

      // Route based on intent: families browse, providers go to portal
      if (data.intent === "family") {
        router.push("/browse");
      } else {
        router.push("/portal");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Complete flow error:", message, err);
      setError(`Something went wrong: ${message}`);
      setLoading(false);
    }
  };

  const createProviderProfile = async (
    supabase: ReturnType<typeof createClient>,
    accountId: string
  ): Promise<string> => {
    const profileType = data.providerType === "caregiver" ? "caregiver" : "organization";

    if (data.claimedProfileId && data.claimedProfile) {
      // Claiming an existing seeded profile
      const s = data.claimedProfile;
      const claimUpdate: Record<string, unknown> = {
        account_id: accountId,
        claim_state: "pending",
      };

      if (!s.display_name?.trim() && data.orgName) claimUpdate.display_name = data.orgName;
      if (!s.city && data.city) claimUpdate.city = data.city;
      if (!s.state && data.state) claimUpdate.state = data.state;
      if (!s.zip && data.zip) claimUpdate.zip = data.zip;
      if ((!s.care_types || s.care_types.length === 0) && data.careTypes.length > 0) {
        claimUpdate.care_types = data.careTypes;
      }
      if (!s.description?.trim() && data.description) claimUpdate.description = data.description;
      if (!s.phone && data.phone) claimUpdate.phone = data.phone;

      const { error: claimErr } = await supabase
        .from("business_profiles")
        .update(claimUpdate)
        .eq("id", data.claimedProfileId);
      if (claimErr) throw claimErr;

      return data.claimedProfileId;
    }

    // Create new profile
    const displayName = data.providerType === "organization" ? data.orgName : data.displayName;
    const slug = generateSlug(displayName, data.city, data.state);

    const { data: newProfile, error: profileErr } = await supabase
      .from("business_profiles")
      .insert({
        account_id: accountId,
        slug,
        type: profileType,
        category: data.category,
        display_name: displayName,
        description: data.description || null,
        phone: data.phone || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        care_types: data.careTypes,
        claim_state: "pending",
        verification_state: "unverified",
        source: "user_created",
        is_active: true,
        metadata: {
          visible_to_families: data.visibleToFamilies,
          visible_to_providers: data.visibleToProviders,
        },
      })
      .select("id")
      .single();

    if (profileErr) throw profileErr;
    return newProfile.id;
  };

  const createFamilyProfile = async (
    supabase: ReturnType<typeof createClient>,
    accountId: string
  ): Promise<string> => {
    const slug = generateSlug(data.displayName, data.city, data.state);

    const { data: newProfile, error: profileErr } = await supabase
      .from("business_profiles")
      .insert({
        account_id: accountId,
        slug,
        type: "family",
        display_name: data.displayName,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        care_types: data.careNeeds,
        claim_state: "claimed",
        verification_state: "unverified",
        source: "user_created",
        is_active: true,
        metadata: {
          care_recipient_name: data.careRecipientName || null,
          care_recipient_relation: data.careRecipientRelation || null,
        },
      })
      .select("id")
      .single();

    if (profileErr) throw profileErr;
    return newProfile.id;
  };

  // ──────────────────────────────────────────────────────────
  // Render Helpers
  // ──────────────────────────────────────────────────────────

  const stepConfig = getStepConfig(step, data, !!user);
  const showProgress = step !== "intent" && data.intent !== null;

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stepConfig.title}
      size={step === "auth" || step === "verify-code" ? "sm" : "lg"}
    >
      {/* Progress bar (for onboarding steps) */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-500">
              Step {stepConfig.stepNumber} of {stepConfig.totalSteps}
            </span>
            {canGoBack() && (
              <button
                type="button"
                onClick={goBack}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Back
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(stepConfig.stepNumber / stepConfig.totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Step: Intent Selection */}
      {step === "intent" && (
        <IntentStep onSelect={handleIntentSelect} />
      )}

      {/* Step: Provider Type */}
      {step === "provider-type" && (
        <ProviderTypeStep onSelect={handleProviderTypeSelect} />
      )}

      {/* Step: Provider Info */}
      {step === "provider-info" && (
        <ProviderInfoStep
          data={data}
          updateData={updateData}
          loading={loading}
          isValid={isProviderInfoValid()}
          onNext={handleProviderInfoNext}
          careTypes={CARE_TYPES}
          categories={ORG_CATEGORIES}
        />
      )}

      {/* Step: Org Search */}
      {step === "org-search" && (
        <OrgSearchStep
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searching={searching}
          hasSearched={hasSearched}
          selectedOrgId={selectedOrgId}
          setSelectedOrgId={setSelectedOrgId}
          onSearch={() => {
            setHasSearched(false);
            searchOrgs(searchQuery);
          }}
          onNext={handleOrgSearchNext}
        />
      )}

      {/* Step: Family Info */}
      {step === "family-info" && (
        <FamilyInfoStep
          data={data}
          updateData={updateData}
          onNext={handleFamilyInfoNext}
        />
      )}

      {/* Step: Family Needs */}
      {step === "family-needs" && (
        <FamilyNeedsStep
          data={data}
          updateData={updateData}
          loading={loading}
          careTypes={CARE_TYPES}
          onNext={handleFamilyNeedsNext}
          isAuthenticated={!!user}
        />
      )}

      {/* Step: Auth */}
      {step === "auth" && (
        <AuthStep
          mode={authMode}
          setMode={setAuthMode}
          data={data}
          updateData={updateData}
          loading={loading}
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onSendOtpCode={handleSendOtpForSignIn}
          onBack={goBack}
        />
      )}

      {/* Step: Verify Code */}
      {step === "verify-code" && (
        <VerifyCodeStep
          email={data.email}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          loading={loading}
          resendCooldown={resendCooldown}
          onVerify={handleVerifyOtp}
          onResend={handleResendCode}
          onBack={() => {
            setStep("auth");
            setOtpCode("");
            setError("");
          }}
        />
      )}
    </Modal>
  );
}

// ============================================================
// Step Components
// ============================================================

function IntentStep({ onSelect }: { onSelect: (intent: UserIntent) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-6">
        Tell us what brings you to Olera so we can personalize your experience.
      </p>

      <button
        type="button"
        onClick={() => onSelect("family")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">I&apos;m looking for care</h3>
            <p className="text-sm text-gray-500 mt-1">
              Find care providers for yourself or a loved one
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect("provider")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">I&apos;m a care provider</h3>
            <p className="text-sm text-gray-500 mt-1">
              List your services and connect with families
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

function ProviderTypeStep({ onSelect }: { onSelect: (type: ProviderType) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-6">
        Which best describes you?
      </p>

      <button
        type="button"
        onClick={() => onSelect("organization")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
        <p className="text-sm text-gray-500 mt-1">
          Assisted living, home care agency, hospice, or other care facility
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelect("caregiver")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <h3 className="text-lg font-semibold text-gray-900">Private Caregiver</h3>
        <p className="text-sm text-gray-500 mt-1">
          Independent caregiver offering personal care services
        </p>
      </button>
    </div>
  );
}

function ProviderInfoStep({
  data,
  updateData,
  loading,
  isValid,
  onNext,
  careTypes,
  categories,
}: {
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  loading: boolean;
  isValid: boolean;
  onNext: () => void;
  careTypes: string[];
  categories: { value: ProfileCategory; label: string }[];
}) {
  const isOrg = data.providerType === "organization";

  return (
    <div className="space-y-4">
      {isOrg ? (
        <Input
          label="Organization name"
          type="text"
          value={data.orgName}
          onChange={(e) => updateData({ orgName: (e.target as HTMLInputElement).value })}
          placeholder="e.g., Sunrise Senior Living"
          required
        />
      ) : (
        <Input
          label="Your name"
          type="text"
          value={data.displayName}
          onChange={(e) => updateData({ displayName: (e.target as HTMLInputElement).value })}
          placeholder="First and last name"
          required
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="City"
          type="text"
          value={data.city}
          onChange={(e) => updateData({ city: (e.target as HTMLInputElement).value })}
          placeholder="City"
        />
        <Input
          label="State"
          type="text"
          value={data.state}
          onChange={(e) => updateData({ state: (e.target as HTMLInputElement).value })}
          placeholder="State"
        />
      </div>

      {isOrg && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization type
          </label>
          <select
            value={data.category || ""}
            onChange={(e) => updateData({ category: e.target.value as ProfileCategory || null })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a type...</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Care types offered
        </label>
        <div className="flex flex-wrap gap-2">
          {careTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                const current = data.careTypes;
                if (current.includes(type)) {
                  updateData({ careTypes: current.filter((t) => t !== type) });
                } else {
                  updateData({ careTypes: [...current, type] });
                }
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                data.careTypes.includes(type)
                  ? "bg-primary-100 text-primary-700 border-2 border-primary-300"
                  : "bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Phone number"
        type="tel"
        value={data.phone}
        onChange={(e) => updateData({ phone: (e.target as HTMLInputElement).value })}
        placeholder="(555) 123-4567"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Short description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder={isOrg
            ? "Tell families a bit about your organization..."
            : "Tell families a bit about yourself and your experience..."
          }
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
        />
      </div>

      <p className="text-xs text-gray-400">
        Your profile will be visible by default. You can change this anytime in Settings.
      </p>

      <Button
        type="button"
        onClick={onNext}
        disabled={!isValid || loading}
        loading={loading}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}

function OrgSearchStep({
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  hasSearched,
  selectedOrgId,
  setSelectedOrgId,
  onSearch,
  onNext,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Profile[];
  searching: boolean;
  hasSearched: boolean;
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  onSearch: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        We may already have your organization listed. Search to claim your existing profile, or skip to create a new one.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by organization name..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
        />
        <Button type="button" onClick={onSearch} loading={searching} variant="secondary">
          Search
        </Button>
      </div>

      {hasSearched && (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {searchResults.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">No matching organizations found</p>
              <p className="text-xs text-gray-500 mt-1">
                We&apos;ll create a new profile for you
              </p>
            </div>
          ) : (
            searchResults.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedOrgId === org.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900">{org.display_name}</p>
                {(org.city || org.state) && (
                  <p className="text-sm text-gray-500">
                    {[org.city, org.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {org.care_types && org.care_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {org.care_types.slice(0, 3).map((type) => (
                      <span
                        key={type}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      <Button type="button" onClick={onNext} fullWidth size="lg">
        {selectedOrgId ? "Claim this organization" : "Continue with new profile"}
      </Button>

      {hasSearched && searchResults.length > 0 && !selectedOrgId && (
        <p className="text-xs text-gray-400 text-center">
          Don&apos;t see your organization? Continue to create a new profile.
        </p>
      )}
    </div>
  );
}

function FamilyInfoStep({
  data,
  updateData,
  onNext,
}: {
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  onNext: () => void;
}) {
  const isValid = data.displayName.trim().length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Tell us a bit about who needs care so we can help you find the right providers.
      </p>

      <Input
        label="Your name"
        type="text"
        value={data.displayName}
        onChange={(e) => updateData({ displayName: (e.target as HTMLInputElement).value })}
        placeholder="First and last name"
        required
      />

      <Input
        label="Care recipient's name (optional)"
        type="text"
        value={data.careRecipientName}
        onChange={(e) => updateData({ careRecipientName: (e.target as HTMLInputElement).value })}
        placeholder="Who will be receiving care?"
      />

      <Input
        label="Your relationship (optional)"
        type="text"
        value={data.careRecipientRelation}
        onChange={(e) => updateData({ careRecipientRelation: (e.target as HTMLInputElement).value })}
        placeholder="e.g., Parent, Spouse, Self"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="City"
          type="text"
          value={data.city}
          onChange={(e) => updateData({ city: (e.target as HTMLInputElement).value })}
          placeholder="City"
        />
        <Input
          label="State"
          type="text"
          value={data.state}
          onChange={(e) => updateData({ state: (e.target as HTMLInputElement).value })}
          placeholder="State"
        />
      </div>

      <Button type="button" onClick={onNext} disabled={!isValid} fullWidth size="lg">
        Continue
      </Button>
    </div>
  );
}

function FamilyNeedsStep({
  data,
  updateData,
  loading,
  careTypes,
  onNext,
  isAuthenticated,
}: {
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  loading: boolean;
  careTypes: string[];
  onNext: () => void;
  isAuthenticated: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        What types of care are you looking for? Select all that apply.
      </p>

      <div className="flex flex-wrap gap-2">
        {careTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              const current = data.careNeeds;
              if (current.includes(type)) {
                updateData({ careNeeds: current.filter((t) => t !== type) });
              } else {
                updateData({ careNeeds: [...current, type] });
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              data.careNeeds.includes(type)
                ? "bg-primary-100 text-primary-700 border-2 border-primary-300"
                : "bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <Button type="button" onClick={onNext} loading={loading} fullWidth size="lg">
        {isAuthenticated ? "Complete setup" : "Continue"}
      </Button>
    </div>
  );
}

function AuthStep({
  mode,
  setMode,
  data,
  updateData,
  loading,
  onSignUp,
  onSignIn,
  onSendOtpCode,
  onBack,
}: {
  mode: "sign-up" | "sign-in";
  setMode: (mode: "sign-up" | "sign-in") => void;
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  loading: boolean;
  onSignUp: (e: React.FormEvent) => void;
  onSignIn: (e: React.FormEvent) => void;
  onSendOtpCode: () => void;
  onBack: () => void;
}) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [socialToast, setSocialToast] = useState("");

  const handleSocialClick = (provider: string) => {
    setSocialToast(`${provider} sign-in coming soon`);
    setTimeout(() => setSocialToast(""), 2500);
  };

  return (
    <div>
      {/* Back button for auth step */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <p className="text-sm text-gray-600 mb-5">
        {mode === "sign-up"
          ? "Create an account to save your profile and start connecting."
          : "Sign in to your existing account."}
      </p>

      {/* Social auth buttons (primary) */}
      <div className="space-y-2.5 mb-4">
        <button
          type="button"
          onClick={() => handleSocialClick("Apple")}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>

        <button
          type="button"
          onClick={() => handleSocialClick("Google")}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleSocialClick("Facebook")}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg font-medium text-sm hover:bg-[#166FE5] transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Continue with Facebook
        </button>
      </div>

      {/* Toast for social auth */}
      {socialToast && (
        <div className="mb-4 bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm text-center">
          {socialToast}
        </div>
      )}

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400">or</span>
        </div>
      </div>

      {/* Email form (secondary) */}
      {!showEmailForm ? (
        <button
          type="button"
          onClick={() => setShowEmailForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Continue with email
        </button>
      ) : (
        <form onSubmit={mode === "sign-up" ? onSignUp : onSignIn} className="space-y-3">
          <Input
            label="Email"
            type="email"
            name="email"
            value={data.email}
            onChange={(e) => updateData({ email: (e.target as HTMLInputElement).value })}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <div>
            <Input
              label="Password"
              type="password"
              name="password"
              value={data.password}
              onChange={(e) => updateData({ password: (e.target as HTMLInputElement).value })}
              placeholder={mode === "sign-up" ? "At least 8 characters" : "Your password"}
              required
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              helpText={mode === "sign-up" ? "Must be at least 8 characters" : undefined}
            />
            {mode === "sign-in" && (
              <button
                type="button"
                onClick={onSendOtpCode}
                disabled={loading || !data.email.trim()}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Email me a code instead
              </button>
            )}
          </div>

          <Button type="submit" loading={loading} fullWidth size="md">
            {mode === "sign-up" ? "Create account & finish" : "Sign in & finish"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 pt-4">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            New to Olera?{" "}
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Create an account
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function VerifyCodeStep({
  email,
  otpCode,
  setOtpCode,
  loading,
  resendCooldown,
  onVerify,
  onResend,
  onBack,
}: {
  email: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  loading: boolean;
  resendCooldown: number;
  onVerify: (e?: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  return (
    <div className="py-2">
      <div className="text-center mb-6">
        <div className="mb-4">
          <svg className="w-14 h-14 text-primary-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-base text-gray-600">We sent a verification code to</p>
        <p className="font-semibold text-gray-900 mt-1">{email}</p>
      </div>

      <form onSubmit={onVerify} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 text-center mb-3">
            Enter 8-digit code
          </label>
          <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />
        </div>

        <Button type="submit" loading={loading} fullWidth size="md" disabled={otpCode.length !== 8}>
          Verify & complete setup
        </Button>

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">Didn&apos;t receive the code?</p>
          {resendCooldown > 0 ? (
            <p className="text-sm text-gray-400">Resend available in {resendCooldown}s</p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={loading}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm focus:outline-none focus:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 text-sm focus:outline-none focus:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function generateSlug(name: string, city: string, state: string): string {
  const parts = [name, city, state].filter(Boolean);
  const slug = parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}
