"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { MyCareSidebar } from "@/components/portal/my-care/MyCareTabBar";
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
  const { anonSaves, toggleSave: toggleProviderSave } = useSavedProviders();
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

      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .eq("from_profile_id", activeProfile.id)
        .in("type", ["inquiry", "save"])
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      const connections = (data || []) as Connection[];

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

  // Refetch when window regains focus (e.g., user navigated back from provider page)
  useEffect(() => {
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchData]);

  const handleUnsave = async (connectionId: string) => {
    setSaves((prev) => prev.filter((s) => s.id !== connectionId));

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("connections").delete().eq("id", connectionId);
    }
  };

  const latestInquiry = inquiries.length > 0 ? inquiries[0] : null;

  const tabProps = {
    activeTab,
    onTabChange: setActiveTab,
    counts: { connections: inquiries.length, saved: saves.length + anonSaves.length },
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "profile":
        return <CareProfileTab latestInquiry={latestInquiry} />;
      case "connections":
        return <MyConnectionsTab connections={inquiries} />;
      case "saved":
        return (
          <SavedProvidersTab
            saves={saves}
            anonSaves={anonSaves}
            onUnsave={handleUnsave}
            onAnonUnsave={(providerId) => {
              const entry = anonSaves.find((s) => s.providerId === providerId);
              if (entry) {
                toggleProviderSave({
                  providerId: entry.providerId,
                  slug: entry.slug,
                  name: entry.name,
                  location: entry.location,
                  careTypes: entry.careTypes,
                  image: entry.image,
                });
              }
            }}
          />
        );
      case "messages":
        return <MessagesPlaceholder />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:h-full">
        <div className="flex gap-6 lg:h-full">

          {/* ── Left Sidebar (Desktop) — fixed, matches Community Forum ── */}
          <aside className="hidden lg:block w-[400px] flex-shrink-0">
            <div className="fixed top-[64px] w-[380px] h-[calc(100vh-64px)] left-0 bg-white border-r border-gray-200 overflow-hidden flex flex-col">
              <MyCareSidebar {...tabProps} />
            </div>
          </aside>

          {/* ── Main Content — fixed right panel on desktop ── */}
          <div className="flex-1 min-w-0 lg:ml-[344px]">

            {/* Desktop: Fixed Right Panel */}
            <div className="hidden lg:flex lg:flex-col fixed top-[64px] right-0 left-[380px] h-[calc(100vh-64px)] bg-gray-50/50 overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden pt-5 px-5 pr-[max(1.25rem,calc((100vw-1280px)/2+1.25rem))]">

                {/* Header card */}
                <div className="flex-shrink-0 p-5 bg-white rounded-xl shadow-sm mb-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {activeTab === "profile" && "Care Profile"}
                    {activeTab === "connections" && "My Connections"}
                    {activeTab === "saved" && "Saved Providers"}
                    {activeTab === "messages" && "Messages"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === "profile" &&
                      "Your care preferences and contact information."}
                    {activeTab === "connections" &&
                      "Providers you've connected with."}
                    {activeTab === "saved" &&
                      "Providers you've saved for later."}
                    {activeTab === "messages" &&
                      "Direct messages with your providers."}
                  </p>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto pb-5">
                  {renderContent()}
                </div>
              </div>
            </div>

            {/* Mobile: Natural scrolling layout */}
            <div className="lg:hidden">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">My Care</h1>
                <p className="text-base text-gray-600 mt-1">
                  Manage your care profile, connections, and saved providers.
                </p>
              </div>

              {/* Mobile category pills */}
              <MyCareTabBar {...tabProps} />

              {/* Mobile content */}
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
