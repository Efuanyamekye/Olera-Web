"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  CARE_TYPE_LABELS,
  URGENCY_LABELS,
  RECIPIENT_LABELS,
} from "@/components/providers/connection-card/constants";
import type { Connection, Profile } from "@/lib/types";

interface ConnectionWithProfile extends Connection {
  toProfile: Profile | null;
}

interface MyConnectionsTabProps {
  connections: ConnectionWithProfile[];
}

const STATUS_BADGE: Record<
  string,
  { variant: "default" | "pending" | "verified"; label: string }
> = {
  pending: { variant: "pending", label: "Pending" },
  accepted: { variant: "verified", label: "Accepted" },
  declined: { variant: "default", label: "Declined" },
  archived: { variant: "default", label: "Archived" },
};

function parseMessageJson(message: string | null) {
  if (!message) return null;
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

function AvatarInitial({ name }: { name: string }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {initial}
    </div>
  );
}

export default function MyConnectionsTab({
  connections,
}: MyConnectionsTabProps) {
  if (connections.length === 0) {
    return (
      <EmptyState
        title="No connections yet"
        description="Browse providers and connect to get started."
        action={
          <Link href="/browse">
            <Button>Browse Providers</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => {
        const provider = connection.toProfile;
        const name = provider?.display_name || "Unknown Provider";
        const location = [provider?.city, provider?.state]
          .filter(Boolean)
          .join(", ");
        const badge = STATUS_BADGE[connection.status] || STATUS_BADGE.pending;
        const createdAt = new Date(connection.created_at).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" }
        );

        const parsed = parseMessageJson(connection.message);
        const careType = parsed?.care_type
          ? CARE_TYPE_LABELS[parsed.care_type as keyof typeof CARE_TYPE_LABELS] ||
            parsed.care_type
          : null;
        const urgency = parsed?.urgency
          ? URGENCY_LABELS[parsed.urgency] || parsed.urgency
          : null;
        const recipient = parsed?.care_recipient
          ? RECIPIENT_LABELS[parsed.care_recipient] || parsed.care_recipient
          : null;

        return (
          <Link
            key={connection.id}
            href={`/portal/connections/${connection.id}`}
            className="block bg-white rounded-xl border border-gray-200 hover:shadow-sm hover:border-gray-300 transition-all duration-150 p-5"
          >
            <div className="flex items-start gap-4">
              <AvatarInitial name={name} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {name}
                  </h3>
                  <Badge variant={badge.variant} className="text-xs !py-0.5 !px-2">
                    {badge.label}
                  </Badge>
                </div>

                {location && (
                  <p className="text-sm text-gray-500 mb-1.5">{location}</p>
                )}

                {/* Care details */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                  {careType && <span>{careType}</span>}
                  {recipient && (
                    <>
                      <span className="text-gray-300">&middot;</span>
                      <span>{recipient}</span>
                    </>
                  )}
                  {urgency && (
                    <>
                      <span className="text-gray-300">&middot;</span>
                      <span>{urgency}</span>
                    </>
                  )}
                </div>

                {/* Accepted: show quick contact info */}
                {connection.status === "accepted" && provider && (
                  <div className="flex gap-2 mt-3">
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-md font-medium hover:bg-primary-100 transition-colors"
                      >
                        Call
                      </a>
                    )}
                    {provider.email && (
                      <a
                        href={`mailto:${provider.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-md font-medium hover:bg-primary-100 transition-colors"
                      >
                        Email
                      </a>
                    )}
                    {provider.slug && (
                      <Link
                        href={`/provider/${provider.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md font-medium hover:bg-gray-100 transition-colors"
                      >
                        Profile
                      </Link>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400">{createdAt}</p>
                  <span className="text-xs text-primary-600 font-medium">
                    View details &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
