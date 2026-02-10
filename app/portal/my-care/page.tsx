"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import EmptyState from "@/components/ui/EmptyState";
import MyCareTabBar, {
  type MyCareTab,
} from "@/components/portal/my-care/MyCareTabBar";
import CareProfileTab from "@/components/portal/my-care/CareProfileTab";
import MyConnectionsTab from "@/components/portal/my-care/MyConnectionsTab";
import SavedProvidersTab from "@/components/portal/my-care/SavedProvidersTab";
import MessagesPlaceholder from "@/components/portal/my-care/MessagesPlaceholder";
import type { Connection, Profile } from "@/lib/types";

interface ConnectionWithProfile extends Connection {
  toProfile: Profile | null;
}

export default function MyCarePage() {
  const { activeProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<MyCareTab>("profile");
  const [inquiries, setInquiries] = useState<ConnectionWithProfile[]>([]);
  const [saves, setSaves] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!activeProfile || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Fetch all connections sent by this family profile (inquiries + saves)
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .eq("from_profile_id", activeProfile.id)
        .in("type", ["inquiry", "save"])
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      const connections = (data || []) as Connection[];

      // Bulk-fetch associated profiles
      const profileIds = new Set<string>();
      connections.forEach((c) => profileIds.add(c.to_profile_id));

      let profiles: Profile[] = [];
      if (profileIds.size > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", Array.from(profileIds));
        profiles = (profileData as Profile[]) || [];
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      const enriched: ConnectionWithProfile[] = connections.map((c) => ({
        ...c,
        toProfile: profileMap.get(c.to_profile_id) || null,
      }));

      setInquiries(enriched.filter((c) => c.type === "inquiry"));
      setSaves(enriched.filter((c) => c.type === "save"));
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnsave = async (connectionId: string) => {
    // Optimistic removal
    setSaves((prev) => prev.filter((s) => s.id !== connectionId));

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("connections").delete().eq("id", connectionId);
    }
  };

  // Gate: only family users
  if (activeProfile && activeProfile.type !== "family") {
    return (
      <EmptyState
        title="This page is for care seekers"
        description="Switch to a family profile to access your care hub."
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading your care hub...</p>
      </div>
    );
  }

  // Latest inquiry for Care Profile tab
  const latestInquiry = inquiries.length > 0 ? inquiries[0] : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Care</h1>
        <p className="text-lg text-gray-600 mt-1">
          Manage your care profile, connections, and saved providers.
        </p>
      </div>

      {/* Tab bar */}
      <MyCareTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          connections: inquiries.length,
          saved: saves.length,
        }}
      />

      {/* Tab content */}
      {activeTab === "profile" && (
        <CareProfileTab latestInquiry={latestInquiry} />
      )}
      {activeTab === "connections" && (
        <MyConnectionsTab connections={inquiries} />
      )}
      {activeTab === "saved" && (
        <SavedProvidersTab
          saves={saves}
          anonSaves={[]}
          onUnsave={handleUnsave}
          onAnonUnsave={() => {}}
        />
      )}
      {activeTab === "messages" && <MessagesPlaceholder />}
    </div>
  );
}
