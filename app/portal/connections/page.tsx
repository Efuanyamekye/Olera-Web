"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, Profile } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/providers/UpgradePrompt";

interface ConnectionWithProfile extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

type TabKey = "all" | "inquiry" | "invitation" | "application";

const TAB_LABELS: Record<TabKey, string> = {
  all: "All",
  inquiry: "Inquiries",
  invitation: "Invitations",
  application: "Applications",
};

export default function ConnectionsPage() {
  const { activeProfile, membership } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  const hasFullAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const fetchConnections = useCallback(async () => {
    if (!activeProfile || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Fetch ALL connections involving this profile (inbound and outbound)
      const { data, error: fetchError } = await supabase
        .from("connections")
        .select("*")
        .or(`to_profile_id.eq.${activeProfile.id},from_profile_id.eq.${activeProfile.id}`)
        .neq("type", "save")
        .order("created_at", { ascending: false });

      if (fetchError) throw new Error(fetchError.message);

      // Fetch associated profiles
      const connectionData = (data || []) as Connection[];
      const profileIds = new Set<string>();
      connectionData.forEach((c) => {
        profileIds.add(c.from_profile_id);
        profileIds.add(c.to_profile_id);
      });

      let profiles: Profile[] = [];
      if (profileIds.size > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", Array.from(profileIds));
        profiles = (profileData as Profile[]) || [];
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const enriched: ConnectionWithProfile[] = connectionData.map((c) => ({
        ...c,
        fromProfile: profileMap.get(c.from_profile_id) || null,
        toProfile: profileMap.get(c.to_profile_id) || null,
      }));

      setConnections(enriched);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleStatusUpdate = async (
    connectionId: string,
    newStatus: "accepted" | "declined" | "archived"
  ) => {
    if (!isSupabaseConfigured() || !activeProfile) return;

    setResponding(connectionId);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", connectionId)
        .or(`to_profile_id.eq.${activeProfile.id},from_profile_id.eq.${activeProfile.id}`);

      if (updateError) throw new Error(updateError.message);

      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId ? { ...c, status: newStatus } : c
        )
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setResponding(null);
    }
  };

  // Filter connections by tab
  const filtered =
    activeTab === "all"
      ? connections
      : connections.filter((c) => c.type === activeTab);

  // Determine which tabs to show based on what connection types exist
  const typeCounts: Record<string, number> = {};
  connections.forEach((c) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });
  const availableTabs: TabKey[] = ["all"];
  if (typeCounts["inquiry"]) availableTabs.push("inquiry");
  if (typeCounts["invitation"]) availableTabs.push("invitation");
  if (typeCounts["application"]) availableTabs.push("application");

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading connections...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
        <p className="text-lg text-gray-600 mt-1">
          {isProvider
            ? "Manage inquiries, invitations, and applications."
            : "Your connections with care providers."}
        </p>
      </div>

      {error && (
        <div
          className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Tabs — only show if there are multiple types */}
      {availableTabs.length > 2 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
                activeTab === tab
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {TAB_LABELS[tab]}
              {tab !== "all" && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({typeCounts[tab] || 0})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={
            activeTab === "all"
              ? "No connections yet"
              : `No ${TAB_LABELS[activeTab].toLowerCase()} yet`
          }
          description={
            isProvider
              ? "When families or caregivers reach out, their connections will appear here."
              : "Browse providers and connect to get started."
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              activeProfileId={activeProfile?.id || ""}
              isProvider={!!isProvider}
              hasFullAccess={hasFullAccess}
              responding={responding === connection.id}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {isProvider && !hasFullAccess && connections.length > 0 && (
        <div className="mt-8">
          <UpgradePrompt context="view full details and respond to connections" />
        </div>
      )}
    </div>
  );
}

function ConnectionCard({
  connection,
  activeProfileId,
  isProvider,
  hasFullAccess,
  responding,
  onStatusUpdate,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  isProvider: boolean;
  hasFullAccess: boolean;
  responding: boolean;
  onStatusUpdate: (id: string, status: "accepted" | "declined" | "archived") => void;
}) {
  // Determine which profile is "the other party"
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");

  // Connection type label
  const typeLabel =
    connection.type === "inquiry"
      ? isInbound ? "Inquiry received" : "Inquiry sent"
      : connection.type === "invitation"
      ? isInbound ? "Invitation received" : "Invitation sent"
      : connection.type === "application"
      ? isInbound ? "Application received" : "Application sent"
      : connection.type;

  const statusBadge: Record<string, { variant: "default" | "pending" | "verified" | "trial"; label: string }> = {
    pending: { variant: "pending", label: "Pending" },
    accepted: { variant: "verified", label: "Accepted" },
    declined: { variant: "default", label: "Declined" },
    archived: { variant: "default", label: "Archived" },
  };

  const badge = statusBadge[connection.status] || statusBadge.pending;
  const createdAt = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  // Should we blur details?
  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {shouldBlur ? blurName(otherName) : otherName}
            </h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
              {typeLabel}
            </span>
          </div>

          {otherLocation && (
            <p className="text-base text-gray-500 mb-2">
              {shouldBlur ? "***" : otherLocation}
            </p>
          )}

          {/* Other profile's type */}
          {otherProfile && (
            <p className="text-sm text-gray-400 mb-2">
              {otherProfile.type === "organization"
                ? "Organization"
                : otherProfile.type === "caregiver"
                ? "Caregiver"
                : "Family"}
            </p>
          )}

          {/* Message / note */}
          {connection.message && (
            <div className="mt-3 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Note:</p>
              <p className="text-base text-gray-700">
                {shouldBlur
                  ? blurText(connection.message)
                  : connection.message}
              </p>
            </div>
          )}

          {shouldBlur && (
            <p className="mt-3 text-sm text-warm-600 font-medium">
              Upgrade to Pro to see full details and respond.
            </p>
          )}

          <p className="text-sm text-gray-400 mt-3">{createdAt}</p>
        </div>
      </div>

      {/* Action buttons for inbound connections with access */}
      {isInbound && hasFullAccess && connection.status === "pending" && (
        <div className="mt-4 flex gap-3">
          <Button
            size="sm"
            onClick={() => onStatusUpdate(connection.id, "accepted")}
            loading={responding}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onStatusUpdate(connection.id, "declined")}
            loading={responding}
          >
            Decline
          </Button>
        </div>
      )}

      {/* Accepted: show contact info */}
      {connection.status === "accepted" && otherProfile && (
        <div className="mt-4 bg-primary-50 rounded-lg p-4">
          <p className="text-base text-primary-800 font-medium mb-1">
            Connection accepted
          </p>
          {otherProfile.phone && (
            <p className="text-base text-primary-700">
              Phone: {otherProfile.phone}
            </p>
          )}
          {otherProfile.email && (
            <p className="text-base text-primary-700">
              Email: {otherProfile.email}
            </p>
          )}
          {otherProfile.slug && (
            <Link
              href={`/provider/${otherProfile.slug}`}
              className="text-sm text-primary-600 hover:underline mt-2 inline-block"
            >
              View full profile
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function blurName(name: string): string {
  if (!name) return "***";
  const parts = name.split(" ");
  return parts.map((p) => p.charAt(0) + "***").join(" ");
}

function blurText(text: string): string {
  if (!text) return "";
  if (text.length <= 20) return "*".repeat(text.length);
  return text.substring(0, 20) + "...";
}
