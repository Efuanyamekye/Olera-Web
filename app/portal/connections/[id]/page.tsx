"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, Profile, OrganizationMetadata, CaregiverMetadata, FamilyMetadata } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import UpgradePrompt from "@/components/providers/UpgradePrompt";

interface ConnectionDetail extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

export default function ConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProfile, membership } = useAuth();
  const [connection, setConnection] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");

  const connectionId = params.id as string;

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  const hasFullAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  useEffect(() => {
    if (!activeProfile || !connectionId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchConnection = async () => {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("connections")
        .select("*")
        .eq("id", connectionId)
        .or(`to_profile_id.eq.${activeProfile.id},from_profile_id.eq.${activeProfile.id}`)
        .single();

      if (fetchError || !data) {
        setError("Connection not found.");
        setLoading(false);
        return;
      }

      const conn = data as Connection;

      // Fetch both profiles
      const profileIds = [conn.from_profile_id, conn.to_profile_id];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", profileIds);

      const profileMap = new Map((profiles as Profile[] || []).map((p) => [p.id, p]));

      setConnection({
        ...conn,
        fromProfile: profileMap.get(conn.from_profile_id) || null,
        toProfile: profileMap.get(conn.to_profile_id) || null,
      });
      setLoading(false);
    };

    fetchConnection();
  }, [activeProfile, connectionId]);

  const handleStatusUpdate = async (newStatus: "accepted" | "declined") => {
    if (!isSupabaseConfigured() || !activeProfile || !connection) return;

    setResponding(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", connection.id)
        .or(`to_profile_id.eq.${activeProfile.id},from_profile_id.eq.${activeProfile.id}`);

      if (updateError) throw new Error(updateError.message);

      setConnection((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection not found</h2>
        <Link href="/portal/connections" className="text-primary-600 hover:underline">
          Back to connections
        </Link>
      </div>
    );
  }

  const isInbound = connection.to_profile_id === activeProfile?.id;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  const typeLabel =
    connection.type === "inquiry" ? "Inquiry"
    : connection.type === "invitation" ? "Invitation"
    : connection.type === "application" ? "Application"
    : connection.type;

  const statusBadge: Record<string, { variant: "default" | "pending" | "verified" | "trial"; label: string }> = {
    pending: { variant: "pending", label: "Pending" },
    accepted: { variant: "verified", label: "Accepted" },
    declined: { variant: "default", label: "Declined" },
    archived: { variant: "default", label: "Archived" },
  };
  const badge = statusBadge[connection.status] || statusBadge.pending;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/portal/connections"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to connections
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base" role="alert">
          {error}
        </div>
      )}

      {/* Connection header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {typeLabel}: {shouldBlur ? blurName(otherProfile?.display_name || "Unknown") : otherProfile?.display_name || "Unknown"}
          </h1>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <span>{isInbound ? "Received" : "Sent"} {new Date(connection.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span>{isInbound ? "From" : "To"}: {shouldBlur ? "***" : otherProfile?.display_name || "Unknown"}</span>
        </div>

        {connection.message && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Note:</p>
            <p className="text-base text-gray-700">
              {shouldBlur ? blurText(connection.message) : connection.message}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {isInbound && hasFullAccess && connection.status === "pending" && (
          <div className="mt-6 flex gap-3">
            <Button onClick={() => handleStatusUpdate("accepted")} loading={responding}>
              Accept
            </Button>
            <Button variant="secondary" onClick={() => handleStatusUpdate("declined")} loading={responding}>
              Decline
            </Button>
          </div>
        )}

        {shouldBlur && (
          <div className="mt-6">
            <UpgradePrompt context="view full profile details and respond" />
          </div>
        )}
      </div>

      {/* Other party's profile (inline) */}
      {otherProfile && !shouldBlur && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isInbound ? "Their" : "Recipient"} Profile
          </h2>

          <ProfileEmbed profile={otherProfile} showContact={connection.status === "accepted"} />
        </div>
      )}
    </div>
  );
}

function ProfileEmbed({ profile, showContact }: { profile: Profile; showContact: boolean }) {
  const locationStr = [profile.city, profile.state].filter(Boolean).join(", ");
  const meta = profile.metadata as OrganizationMetadata & CaregiverMetadata & FamilyMetadata;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{profile.display_name}</h3>
          <p className="text-sm text-gray-500">
            {profile.type === "organization" ? "Organization" : profile.type === "caregiver" ? "Caregiver" : "Family"}
            {locationStr && ` \u00B7 ${locationStr}`}
          </p>
        </div>
      </div>

      {profile.description && (
        <p className="text-base text-gray-600">{profile.description}</p>
      )}

      {profile.care_types.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.care_types.map((type) => (
            <span key={type} className="bg-primary-50 text-primary-700 text-sm px-3 py-1 rounded-full">
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Family-specific info */}
      {profile.type === "family" && (
        <div className="grid grid-cols-2 gap-4">
          {meta?.timeline && (
            <div>
              <dt className="text-sm text-gray-500">Timeline</dt>
              <dd className="text-gray-900 font-medium">
                {meta.timeline === "immediate" ? "Immediate" :
                 meta.timeline === "within_1_month" ? "Within 1 month" :
                 meta.timeline === "within_3_months" ? "Within 3 months" :
                 meta.timeline === "exploring" ? "Just exploring" : meta.timeline}
              </dd>
            </div>
          )}
          {meta?.relationship_to_recipient && (
            <div>
              <dt className="text-sm text-gray-500">Relationship</dt>
              <dd className="text-gray-900 font-medium">{meta.relationship_to_recipient}</dd>
            </div>
          )}
          {meta?.care_needs && meta.care_needs.length > 0 && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500 mb-1">Care Needs</dt>
              <dd className="flex flex-wrap gap-2">
                {meta.care_needs.map((need) => (
                  <span key={need} className="bg-secondary-50 text-secondary-700 text-xs px-2.5 py-1 rounded-full">
                    {need}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      )}

      {/* Caregiver-specific info */}
      {profile.type === "caregiver" && (
        <div className="grid grid-cols-2 gap-4">
          {meta?.years_experience && (
            <div>
              <dt className="text-sm text-gray-500">Experience</dt>
              <dd className="text-gray-900 font-medium">{meta.years_experience} years</dd>
            </div>
          )}
          {meta?.certifications && meta.certifications.length > 0 && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500 mb-1">Certifications</dt>
              <dd className="flex flex-wrap gap-2">
                {meta.certifications.map((cert) => (
                  <span key={cert} className="bg-secondary-50 text-secondary-700 text-xs px-2.5 py-1 rounded-full">
                    {cert}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      )}

      {/* Contact info — only shown when connection is accepted */}
      {showContact && (
        <div className="bg-primary-50 rounded-lg p-4 mt-4">
          <p className="text-sm font-medium text-primary-800 mb-2">Contact Information</p>
          {profile.phone && (
            <p className="text-base text-primary-700">Phone: {profile.phone}</p>
          )}
          {profile.email && (
            <p className="text-base text-primary-700">Email: {profile.email}</p>
          )}
          {profile.website && (
            <p className="text-base text-primary-700">
              Website: <a href={profile.website} target="_blank" rel="noopener noreferrer" className="underline">{profile.website}</a>
            </p>
          )}
          {!profile.phone && !profile.email && !profile.website && (
            <p className="text-sm text-primary-600">No contact information provided yet.</p>
          )}
        </div>
      )}

      {/* Link to full profile page (for providers) */}
      {(profile.type === "organization" || profile.type === "caregiver") && profile.slug && (
        <Link
          href={`/provider/${profile.slug}`}
          className="text-primary-600 hover:underline text-sm font-medium inline-flex items-center gap-1"
        >
          View full public profile
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
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
