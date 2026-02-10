"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type { Connection, Profile } from "@/lib/types";
import type { SavedProviderEntry } from "@/hooks/use-saved-providers";

interface ConnectionWithProfile extends Connection {
  toProfile: Profile | null;
}

interface SavedProvidersTabProps {
  saves: ConnectionWithProfile[];
  anonSaves: SavedProviderEntry[];
  onUnsave: (connectionId: string) => void;
  onAnonUnsave: (providerId: string) => void;
}

function FilledHeartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="#EF4444"
      stroke="#EF4444"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

/** Parse display data from a save connection's message JSON */
function parseSaveMessage(message: string | null) {
  if (!message) return null;
  try {
    return JSON.parse(message) as {
      name?: string;
      slug?: string;
      location?: string;
      careTypes?: string[];
      image?: string;
    };
  } catch {
    return null;
  }
}

function SaveCard({
  name,
  location,
  careTypes,
  slug,
  onUnsave,
  badge,
}: {
  name: string;
  location: string;
  careTypes: string[];
  slug: string;
  onUnsave: () => void;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-sm hover:border-gray-300 transition-all duration-150 p-5 relative">
      {/* Unsave button */}
      <button
        type="button"
        onClick={onUnsave}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
        aria-label={`Remove ${name} from saved`}
      >
        <FilledHeartIcon />
      </button>

      <Link href={`/provider/${slug}`} className="block">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3 mb-3 pr-8">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {(name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {name}
            </h3>
            {location && <p className="text-sm text-gray-500">{location}</p>}
          </div>
        </div>

        {/* Care types */}
        {careTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {careTypes.slice(0, 3).map((ct) => (
              <span
                key={ct}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {ct}
              </span>
            ))}
            {careTypes.length > 3 && (
              <span className="text-xs text-gray-400">
                +{careTypes.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Badge */}
        {badge && (
          <p className="text-xs text-warm-600 mt-2 font-medium">{badge}</p>
        )}
      </Link>
    </div>
  );
}

export default function SavedProvidersTab({
  saves,
  anonSaves,
  onUnsave,
  onAnonUnsave,
}: SavedProvidersTabProps) {
  const totalCount = saves.length + anonSaves.length;

  if (totalCount === 0) {
    return (
      <EmptyState
        title="No saved providers yet"
        description="Save providers while browsing to keep track of your favorites."
        action={
          <Link href="/browse">
            <Button>Browse Providers</Button>
          </Link>
        }
        icon={
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* DB saves */}
      {saves.map((save) => {
        const provider = save.toProfile;
        const messageData = parseSaveMessage(save.message);

        const name =
          provider?.display_name || messageData?.name || "Unknown Provider";
        const location =
          [provider?.city, provider?.state].filter(Boolean).join(", ") ||
          messageData?.location ||
          "";
        const careTypes = provider?.care_types || messageData?.careTypes || [];
        const slug =
          provider?.slug || messageData?.slug || save.to_profile_id;

        return (
          <SaveCard
            key={save.id}
            name={name}
            location={location}
            careTypes={careTypes}
            slug={slug}
            onUnsave={() => onUnsave(save.id)}
          />
        );
      })}

      {/* Anonymous saves */}
      {anonSaves.map((save) => (
        <SaveCard
          key={save.providerId}
          name={save.name}
          location={save.location}
          careTypes={save.careTypes}
          slug={save.slug}
          onUnsave={() => onAnonUnsave(save.providerId)}
          badge="Sign in to keep"
        />
      ))}
    </div>
  );
}
