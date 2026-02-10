"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  CARE_TYPE_LABELS,
  URGENCY_LABELS,
  RECIPIENT_LABELS,
  CONTACT_OPTIONS,
} from "@/components/providers/connection-card/constants";
import type { Connection, Profile } from "@/lib/types";

interface CareProfileTabProps {
  latestInquiry: Connection | null;
}

function parseMessageJson(message: string | null) {
  if (!message) return null;
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5 border-b border-gray-100 last:border-b-0">
      <dt className="text-sm text-gray-500 sm:w-40 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">{value}</dd>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <dl>{children}</dl>
    </div>
  );
}

// ── View Mode ──

function ProfileView({
  profile,
  parsed,
  onEdit,
}: {
  profile: Profile;
  parsed: Record<string, string> | null;
  onEdit: () => void;
}) {
  const firstName = parsed?.seeker_first_name || "";
  const lastName = parsed?.seeker_last_name || "";
  const fullName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : profile.display_name;
  const email = profile.email || parsed?.seeker_email || null;
  const phone = profile.phone || parsed?.seeker_phone || null;
  const contactPref = parsed?.contact_preference
    ? CONTACT_OPTIONS.find((o) => o.value === parsed.contact_preference)
        ?.label || parsed.contact_preference
    : null;

  const careType = parsed?.care_type
    ? CARE_TYPE_LABELS[parsed.care_type as keyof typeof CARE_TYPE_LABELS] ||
      parsed.care_type
    : null;
  const careRecipient = parsed?.care_recipient
    ? RECIPIENT_LABELS[parsed.care_recipient] || parsed.care_recipient
    : null;
  const urgency = parsed?.urgency
    ? URGENCY_LABELS[parsed.urgency] || parsed.urgency
    : null;
  const notes = parsed?.additional_notes || null;

  const hasContactInfo = fullName || email || phone;
  const hasCareInfo = careType || careRecipient || urgency;

  if (!hasContactInfo && !hasCareInfo) {
    return (
      <EmptyState
        title="No care profile yet"
        description="Your care profile will be populated when you submit your first connection request."
        action={<Button onClick={onEdit}>Add Details</Button>}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Care Profile
        </h2>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>

      {hasContactInfo && (
        <SectionCard title="Contact Information">
          <InfoRow label="Name" value={fullName} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Phone" value={phone} />
          <InfoRow label="Preferred contact" value={contactPref} />
        </SectionCard>
      )}

      {hasCareInfo && (
        <SectionCard title="Care Needs">
          <InfoRow label="Who needs care" value={careRecipient} />
          <InfoRow label="Type of help" value={careType} />
          <InfoRow label="Timeline" value={urgency} />
          {notes && <InfoRow label="Additional notes" value={notes} />}
        </SectionCard>
      )}
    </div>
  );
}

// ── Edit Mode ──

function ProfileEdit({
  profile,
  parsed,
  onCancel,
  onSaved,
}: {
  profile: Profile;
  parsed: Record<string, string> | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { refreshAccountData } = useAuth();

  const [firstName, setFirstName] = useState(
    parsed?.seeker_first_name || profile.display_name?.split(" ")[0] || ""
  );
  const [lastName, setLastName] = useState(
    parsed?.seeker_last_name || profile.display_name?.split(" ").slice(1).join(" ") || ""
  );
  const [email, setEmail] = useState(
    profile.email || parsed?.seeker_email || ""
  );
  const [phone, setPhone] = useState(
    profile.phone || parsed?.seeker_phone || ""
  );
  const [contactPref, setContactPref] = useState(
    parsed?.contact_preference || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!isSupabaseConfigured()) return;

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const displayName = `${firstName} ${lastName}`.trim() || profile.display_name;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          email: email || null,
          phone: phone || null,
        })
        .eq("id", profile.id);

      if (updateError) throw new Error(updateError.message);

      await refreshAccountData();
      onSaved();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Edit Care Profile
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">
          Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-primary-600 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-primary-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-primary-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:border-primary-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Preferred contact method
          </label>
          <div className="flex gap-2">
            {CONTACT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContactPref(opt.value)}
                className={[
                  "px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer",
                  contactPref === opt.value
                    ? "bg-primary-50 border-primary-600 text-primary-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function CareProfileTab({
  latestInquiry,
}: CareProfileTabProps) {
  const { activeProfile } = useAuth();
  const [editing, setEditing] = useState(false);

  if (!activeProfile) return null;

  const parsed = parseMessageJson(latestInquiry?.message ?? null);

  if (editing) {
    return (
      <ProfileEdit
        profile={activeProfile}
        parsed={parsed}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <ProfileView
      profile={activeProfile}
      parsed={parsed}
      onEdit={() => setEditing(true)}
    />
  );
}
